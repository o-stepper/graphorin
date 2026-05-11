/**
 * `graphorin tools lint` — RB-49 / suggested DEC-165.
 *
 * Discovers every `tool({...})` registration in the operator's project
 * via static AST analysis (no runtime probe; no `tsc` invocation), runs
 * the three RB-49 rules from `@graphorin/eslint-plugin`, computes the
 * per-tool grader score (40 + 30 + 30 = 100 points), aggregates a
 * structured report, and exits `1` when any tool falls below the
 * `--threshold` (default `60`).
 *
 * ## Surface
 *
 *   graphorin tools lint [--config <path>] [--threshold <n>]
 *                        [--format <text|json>] [--source <pattern>]
 *
 * ## Grader rubric (RB-49 calibration — 40 + 30 + 30 = 100 points)
 *
 * - **description axis (0..40):** 0 if missing / placeholder / shorter
 *   than 20 chars; 16 if length >= 20; 24 if length >= 30; 32 if
 *   length >= 50; 40 if length >= 80.
 * - **examples axis (0..30):** 0 if no examples or > 5; 12 base for
 *   the first example, +6 per additional, cap at 30. Subtract 6 per
 *   PII finding (cap at 0).
 * - **parameter naming axis (0..30):** 30 base, deducted per finding.
 *   -30/N for ambiguous names; -10/N for numeric suffixes.
 *
 * ## Exit codes
 *
 * - `0` — every tool meets or exceeds the threshold.
 * - `1` — at least one tool falls below the threshold.
 * - `2` — invocation could not start (config missing, walker failed).
 *
 * The CLI re-uses the rule modules from `@graphorin/eslint-plugin` so
 * the rule logic has a single source of truth — the per-tool grader,
 * threshold gate, and report formatting are the only logic that lives
 * in the CLI.
 *
 * @packageDocumentation
 */

import { readFile, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import process from 'node:process';

import {
  type DiscoveredTool,
  discoverToolCallsInSource,
  gradeTool,
  type LintFinding,
  type LintFindingKind,
  runToolRules,
  type ToolGraderScore,
} from '@graphorin/eslint-plugin';

import { EXIT_CODES } from '../internal/exit.js';
import {
  brand,
  type CommonOutputOptions,
  defaultJsonSink,
  defaultPrintSink,
  statusMarker,
} from '../internal/output.js';

/**
 * Counter event emitted per below-threshold tool per invocation. The
 * CLI exposes a configurable sink so observability pipelines (Phase
 * 04) can wire the counter into Prometheus / OTLP without touching
 * the CLI runtime. Default: no-op.
 *
 * Mirrors the `tool.lint.threshold.violations.total{toolName,score,
 * threshold}` contract documented in RB-49 § Counter emission.
 *
 * @stable
 */
export interface ToolsLintThresholdViolation {
  readonly toolName: string;
  readonly score: number;
  readonly threshold: number;
}

/** @stable */
export type ToolsLintCounterSink = (event: ToolsLintThresholdViolation) => void;

/** @stable */
export interface ToolsLintOptions extends CommonOutputOptions {
  /** Optional path to a `tsconfig.json` whose `include` overrides the file glob. */
  readonly config?: string;
  /** Minimum acceptable per-tool score. Default `60`. */
  readonly threshold?: number;
  /** Output format. Default `'text'`. */
  readonly format?: 'text' | 'json';
  /** Optional override of the file glob pattern. */
  readonly source?: string;
  /** Override `cwd`. Default `process.cwd()`. */
  readonly cwd?: string;
  /**
   * Test seam — supply a list of `(file, source)` pairs directly so
   * the test does not need to fish around the filesystem.
   */
  readonly inlineSources?: ReadonlyArray<{ readonly file: string; readonly source: string }>;
  /**
   * Optional sink for the `tool.lint.threshold.violations.total`
   * counter (RB-49). The CLI calls this once per below-threshold tool
   * per invocation. Default: no-op.
   */
  readonly counterSink?: ToolsLintCounterSink;
}

/**
 * Documented JSON shape emitted on `--format json`. The shape is
 * stable + forward-compatible with the `@eslint/mcp` industry
 * direction (per-finding `rule` / `severity` / `message` / `location`
 * mirror the ESLint LSP convention).
 *
 * @stable
 */
export interface ToolsLintReport {
  readonly summary: {
    readonly totalTools: number;
    readonly totalFindings: number;
    readonly threshold: number;
    readonly passed: number;
    readonly failed: number;
  };
  readonly tools: ReadonlyArray<ToolsLintReportTool>;
}

/** @stable */
export interface ToolsLintReportTool {
  readonly name: string;
  readonly source: string;
  readonly score: number;
  readonly axes: {
    readonly description: number;
    readonly examples: number;
    readonly parameterNaming: number;
  };
  readonly findings: ReadonlyArray<ToolsLintReportFinding>;
}

/** @stable */
export interface ToolsLintReportFinding {
  readonly rule: LintFinding['rule'];
  readonly kind: LintFindingKind;
  readonly severity: LintFinding['severity'];
  readonly message: string;
  readonly location: { readonly file: string; readonly line: number };
  readonly hint?: string;
  readonly matchedPattern?: string;
}

/** Default file glob honoured when no `--source` / `--config` is supplied. */
const DEFAULT_GLOB = 'src/**/*.{ts,tsx}';

/**
 * Run the discovery + grader pipeline. Returns the structured report
 * the CLI emits to stdout.
 *
 * @stable
 */
export async function runToolsLint(options: ToolsLintOptions = {}): Promise<ToolsLintReport> {
  const cwd = options.cwd ?? process.cwd();
  const threshold = options.threshold ?? 60;
  const format = options.format ?? 'text';

  const sources = await collectSources(cwd, options);
  const tools: DiscoveredTool[] = [];
  for (const { file, source } of sources) {
    tools.push(...discoverToolCallsInSource(file, source));
  }

  const scored: ToolGraderScore[] = [];
  let failed = 0;
  let passed = 0;
  let totalFindings = 0;
  const violations: ToolsLintThresholdViolation[] = [];
  for (const tool of tools) {
    const findings = runToolRules(tool);
    const score = gradeTool(tool, findings);
    scored.push(score);
    totalFindings += findings.length;
    if (score.score < threshold) {
      failed += 1;
      violations.push(
        Object.freeze({
          toolName: score.toolName,
          score: score.score,
          threshold,
        }),
      );
    } else {
      passed += 1;
    }
  }

  // Emit the documented counter exactly once per below-threshold tool
  // per invocation. The default sink is a no-op so non-observability
  // hosts pay nothing; the standalone server's tracer wires its own
  // counter pipeline through `--counter-sink` in v0.2.
  const counterSink = options.counterSink ?? noopCounterSink;
  for (const v of violations) counterSink(v);

  const report: ToolsLintReport = Object.freeze({
    summary: Object.freeze({
      totalTools: scored.length,
      totalFindings,
      threshold,
      passed,
      failed,
    }),
    tools: Object.freeze(scored.map(toReportTool)),
  });

  if (format === 'json') {
    const sink = options.jsonPrint ?? defaultJsonSink;
    sink(report);
  } else {
    emitTextReport(report, options);
  }

  if (failed > 0) {
    process.exitCode = EXIT_CODES.RECOVERABLE_FAILURE;
  }

  return report;
}

function noopCounterSink(_event: ToolsLintThresholdViolation): void {
  /* no-op */
}

function toReportTool(score: ToolGraderScore): ToolsLintReportTool {
  return Object.freeze({
    name: score.toolName,
    source: `${score.file}:${score.line}`,
    score: score.score,
    axes: score.axes,
    findings: Object.freeze(score.findings.map(toReportFinding)),
  });
}

function toReportFinding(finding: LintFinding): ToolsLintReportFinding {
  return Object.freeze({
    rule: finding.rule,
    kind: finding.kind,
    severity: finding.severity,
    message: finding.message,
    location: Object.freeze({ file: finding.file, line: finding.line }),
    ...(finding.hint !== undefined ? { hint: finding.hint } : {}),
    ...(finding.matchedPattern !== undefined ? { matchedPattern: finding.matchedPattern } : {}),
  });
}

function emitTextReport(report: ToolsLintReport, options: ToolsLintOptions): void {
  const print = options.print ?? defaultPrintSink;
  if (report.tools.length === 0) {
    print(brand('no tool({...}) registrations were discovered.'));
    return;
  }
  for (const tool of report.tools) {
    const ok = tool.score >= report.summary.threshold;
    const mark = ok ? statusMarker('ok') : statusMarker('fail');
    const flag = ok ? '' : ' (BELOW THRESHOLD)';
    print(brand(`${mark} ${tool.name} (score=${tool.score}/100)${flag}`));
    print(`  source:    ${tool.source}`);
    print(
      `  axes:      description=${tool.axes.description}, examples=${tool.axes.examples}, parameterNaming=${tool.axes.parameterNaming}`,
    );
    if (tool.findings.length === 0) {
      print(`  findings:  none`);
    } else {
      print(`  findings:`);
      for (const f of tool.findings) {
        print(
          `    [${f.severity}] ${f.rule}: ${f.message} (${f.location.file}:${f.location.line})`,
        );
      }
    }
  }
  const tag = report.summary.failed === 0 ? statusMarker('ok') : statusMarker('fail');
  print(
    brand(
      `${tag} summary: ${report.summary.totalTools} tool(s), ${report.summary.totalFindings} finding(s), threshold=${report.summary.threshold}, passed=${report.summary.passed}, failed=${report.summary.failed}`,
    ),
  );
}

async function collectSources(
  cwd: string,
  options: ToolsLintOptions,
): Promise<ReadonlyArray<{ readonly file: string; readonly source: string }>> {
  if (options.inlineSources !== undefined) return options.inlineSources;

  const glob = options.source ?? (await loadIncludeGlob(cwd, options.config)) ?? DEFAULT_GLOB;
  const files = await walkGlob(cwd, glob);
  const out: Array<{ file: string; source: string }> = [];
  for (const file of files) {
    try {
      const source = await readFile(file, 'utf8');
      out.push({ file, source });
    } catch {
      // Best-effort — skip unreadable files.
    }
  }
  return out;
}

async function loadIncludeGlob(
  cwd: string,
  configPath: string | undefined,
): Promise<string | undefined> {
  if (configPath === undefined) return undefined;
  const abs = isAbsolute(configPath) ? configPath : resolve(cwd, configPath);
  let raw: string;
  try {
    raw = await readFile(abs, 'utf8');
  } catch {
    return undefined;
  }
  let parsed: { readonly include?: ReadonlyArray<string> };
  try {
    parsed = JSON.parse(stripJsonComments(raw)) as { readonly include?: ReadonlyArray<string> };
  } catch {
    return undefined;
  }
  return parsed.include?.[0];
}

function stripJsonComments(raw: string): string {
  // Lightweight block-comment + line-comment stripper. tsconfig.json
  // commonly carries `//` comments which JSON.parse rejects.
  return raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function walkGlob(cwd: string, pattern: string): Promise<string[]> {
  const root = resolveGlobRoot(cwd, pattern);
  const matcher = compileGlob(pattern);
  const out: string[] = [];
  await walkDir(root, async (file) => {
    const rel = relative(cwd, file);
    if (!matcher(rel)) return;
    out.push(file);
  });
  return out.sort();
}

function resolveGlobRoot(cwd: string, pattern: string): string {
  const idx = pattern.indexOf('*');
  if (idx < 0) return resolve(cwd, pattern);
  const prefix = pattern.slice(0, idx);
  return resolve(cwd, prefix);
}

function compileGlob(pattern: string): (rel: string) => boolean {
  // The translation is intentionally done in three phases so the
  // brace-expansion output (which includes literal `(?:...)`) does not
  // collide with the `?` glob translation:
  //
  //   1. Tokenize the four glob constructs into ASCII placeholders
  //      that are guaranteed not to appear in any host project's
  //      filename.
  //   2. Escape every regex meta-character on the remaining literal
  //      text.
  //   3. Substitute the placeholders for the equivalent regex
  //      fragments (with `(?:...)` for brace expansion).
  const BRACE_OPEN = '\u0001';
  const BRACE_CLOSE = '\u0002';
  const BRACE_SEP = '\u0003';
  const GLOBSTAR = '\u0004';
  const STAR = '\u0005';
  const QUESTION = '\u0006';

  // Phase 1: tokenize.
  let tokenized = pattern.replace(
    /\{([^}]+)\}/g,
    (_m, group: string) => `${BRACE_OPEN}${group.split(',').join(BRACE_SEP)}${BRACE_CLOSE}`,
  );
  tokenized = tokenized.replace(/\*\*/g, GLOBSTAR).replace(/\*/g, STAR).replace(/\?/g, QUESTION);

  // Phase 2: escape every remaining regex meta-char on the literal
  // text. The placeholders are non-printable and never collide.
  const escaped = tokenized.replace(/[.+^${}()|[\]\\]/g, '\\$&');

  // Phase 3: substitute the placeholders for the regex fragments.
  const translated = escaped
    .replace(new RegExp(BRACE_OPEN, 'g'), '(?:')
    .replace(new RegExp(BRACE_CLOSE, 'g'), ')')
    .replace(new RegExp(BRACE_SEP, 'g'), '|')
    .replace(new RegExp(GLOBSTAR, 'g'), '.*')
    .replace(new RegExp(STAR, 'g'), '[^/]*')
    .replace(new RegExp(QUESTION, 'g'), '[^/]');

  const re = new RegExp(`^${translated}$`);
  return (rel: string) => {
    const normalized = rel.split(sep).join('/');
    return re.test(normalized);
  };
}

async function walkDir(root: string, visit: (file: string) => Promise<void>): Promise<void> {
  let s: import('node:fs').Stats;
  try {
    s = await stat(root);
  } catch {
    return;
  }
  if (!s.isDirectory()) {
    if (s.isFile()) await visit(root);
    return;
  }
  const queue: string[] = [root];
  while (queue.length > 0) {
    const dir = queue.shift() as string;
    let entries: import('node:fs').Dirent[];
    try {
      entries = await (await import('node:fs/promises')).readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      const next = `${dir}${sep}${entry.name}`;
      if (entry.isDirectory()) queue.push(next);
      else if (entry.isFile()) await visit(next);
    }
  }
}
