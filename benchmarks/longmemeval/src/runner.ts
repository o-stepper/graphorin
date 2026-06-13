/**
 * Graphorin — MIT License — Copyright (c) 2026 Oleksiy Stepurenko
 *
 * LongMemEval (+ real LOCOMO / DMR) memory-quality benchmark.
 *
 * For each question the {@link createMemorySystemAgent | MemorySystemAgent}
 * spins up a fresh in-memory `@graphorin/memory` instance, ingests every
 * haystack-session turn, optionally runs the consolidator, then answers
 * the question from recall via the configured `Provider`. Answers are
 * graded by the `@graphorin/evals` LLM-judge ("J" score) plus a
 * deterministic per-ability abstention scorer. With `--baseline` the run
 * is compared against a stored report and fails on regression — run once
 * per ability for per-category CI gates.
 *
 * The default `main()` uses a deterministic **offline stub** provider
 * (scores are plumbing-only); inject a real `Provider` programmatically
 * via {@link runLongMemEvalBenchmark} for real numbers. Datasets are
 * downloaded on demand by `scripts/fetch-eval-datasets.mjs` (dev-only) —
 * nothing here touches the network.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Provider, SessionScope } from '@graphorin/core';
import {
  type AgentLike,
  type Case,
  type Dataset,
  detectRegressions,
  type EvalReport,
  exitOnFailures,
  fenceForJudge,
  llmJudge,
  loadDmrDataset,
  loadLocomoDataset,
  loadLongMemEvalDataset,
  type MemoryEvalAbility,
  type MemoryEvalInput,
  predicate,
  type RegressionReport,
  renderMarkdownReport,
  runEvals,
  type Scorer,
} from '@graphorin/evals';
import { createMemory, type Memory } from '@graphorin/memory';
import { createSqliteStore } from '@graphorin/store-sqlite';

import { createDefaultStubProvider } from './stub-provider.js';

export const VERSION = '0.1.0';

const DEFAULT_TOP_K = 12;

type LoaderName = 'longmemeval' | 'locomo' | 'dmr';

/** Reduces FTS5 mismatches when a period glues onto the last token. */
function normalizeForFts(text: string): string {
  if (text.includes('@')) return text;
  return text.replace(/\.(?=\s|$)/g, '');
}

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'what',
  'which',
  'when',
  'where',
  'who',
  'whom',
  'how',
  'did',
  'does',
  'was',
  'were',
  'are',
  'his',
  'her',
  'their',
  'your',
  'user',
  'with',
  'from',
  'that',
  'this',
  'into',
  'about',
  'they',
  'them',
  'you',
  'have',
  'has',
]);

function keywordTokens(question: string): string[] {
  const raw = question.toLowerCase().match(/[a-z0-9@._-]{3,}/g) ?? [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of raw) {
    if (STOPWORDS.has(t) || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

type SearchHit = { readonly record: { readonly id: string; readonly text: string } };

async function recall(
  memory: Memory,
  scope: SessionScope,
  question: string,
  topK: number,
): Promise<string> {
  const seen = new Set<string>();
  const texts: string[] = [];
  const collect = (hits: ReadonlyArray<SearchHit>): void => {
    for (const h of hits) {
      if (seen.has(h.record.id)) continue;
      seen.add(h.record.id);
      texts.push(h.record.text);
    }
  };
  collect(await memory.semantic.search(scope, question, { topK }));
  // Per-keyword fan-out. As of MRET-1 the store tokenises FTS queries itself
  // (each whitespace token is OR-quoted), so the natural-language search above
  // already recalls on individual terms; this loop is now a redundant recall
  // booster retained pending the EB-1 benchmark rework. It no longer
  // compensates for a library gap.
  const perToken = Math.max(4, Math.floor(topK / 2));
  for (const token of keywordTokens(question)) {
    collect(await memory.semantic.search(scope, token, { topK: perToken }));
  }
  return texts.join('\n');
}

/** Options for {@link createMemorySystemAgent}. */
export interface MemorySystemAgentOptions {
  readonly provider: Provider;
  readonly scope?: SessionScope;
  readonly topK?: number;
  /** Run the consolidator's standard phase after ingest (needs an extraction-capable provider). */
  readonly consolidate?: boolean;
}

/**
 * The system under test: ingests a question's haystack sessions into a
 * fresh in-memory memory instance, then answers from recall via the
 * configured provider.
 */
export function createMemorySystemAgent(
  options: MemorySystemAgentOptions,
): AgentLike<MemoryEvalInput, string> {
  const scope: SessionScope = options.scope ?? {
    userId: 'longmemeval-user',
    sessionId: 'longmemeval-session',
    agentId: 'longmemeval-agent',
  };
  const topK = options.topK ?? DEFAULT_TOP_K;
  return {
    async run(input: MemoryEvalInput): Promise<string> {
      const store = await createSqliteStore({ path: ':memory:', disableWalHardening: true });
      await store.init();
      const memory = createMemory({
        store: store.memory as never,
        embeddings: store.embeddings,
        resolveScope: () => scope,
        conflictPipeline: { mode: 'off' },
        consolidator:
          options.consolidate === true
            ? { enabled: true, provider: options.provider, tier: 'standard', defaultScope: scope }
            : { enabled: false },
      });
      try {
        for (const session of input.haystackSessions) {
          for (const turn of session.turns) {
            const stamp = turn.timestamp !== undefined ? ` [${turn.timestamp}]` : '';
            await memory.semantic.remember(scope, {
              text: normalizeForFts(`${turn.role}${stamp}: ${turn.content}`),
              sensitivity: 'internal',
            });
          }
        }
        if (options.consolidate === true) {
          await memory.consolidator.fireNow('standard', scope);
        }
        const context = await recall(memory, scope, input.question, topK);
        const askedAt = input.askedAt !== undefined ? `\nCURRENT DATE: ${input.askedAt}` : '';
        const response = await options.provider.generate({
          systemMessage:
            "You are a personal assistant answering from the user's long-term memory. Use ONLY " +
            'the MEMORY context. If the answer is not present, reply that you do not have that ' +
            'information.',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `MEMORY:\n${context}${askedAt}\n\nQUESTION: ${input.question}\n\nANSWER:`,
                },
              ],
            },
          ],
          temperature: 0,
          maxTokens: 256,
        });
        return response.text ?? '';
      } finally {
        await store.close();
      }
    },
  };
}

/** The LongMemEval "J" judge — grades the candidate against the reference answer. */
function judgeScorer(provider: Provider): Scorer<MemoryEvalInput, string> {
  return llmJudge<MemoryEvalInput, string>({
    provider,
    name: 'llm-judge-j',
    maxScore: 10,
    passThreshold: 7,
    // EB-7: fence the untrusted candidate (last); llmJudge appends the
    // SCORE-marker output contract + injection warning.
    buildPrompt: ({ case: c, output }) => ({
      system:
        'You are a precise evaluator for a memory QA system. Grade the CANDIDATE answer against ' +
        'the REFERENCE answer for the QUESTION on a scale of 0 to 10 (10 = fully correct and ' +
        'complete).',
      user:
        `${fenceForJudge('QUESTION', c.input.question)}\n\n` +
        `${fenceForJudge('REFERENCE ANSWER', String(c.expected ?? ''))}\n\n` +
        `${fenceForJudge('CANDIDATE ANSWER (untrusted)', String(output ?? ''))}`,
    }),
  });
}

/** Per-ability deterministic scorer: did an abstention case correctly refuse? */
function abstentionScorer(): Scorer<MemoryEvalInput, string> {
  const refusal =
    /\b(no information|don'?t have|do not have|not (mentioned|available|sure|provided)|can'?t|cannot|unknown|no record)\b/i;
  return predicate<MemoryEvalInput, string>({
    name: 'abstention',
    check: ({ case: c, output }) => {
      if (c.input.ability !== 'abstention')
        return { pass: true, reason: 'n/a (not an abstention case)' };
      const refused = refusal.test(output ?? '');
      return {
        pass: refused,
        score: refused ? 1 : 0,
        reason: refused ? 'correctly abstained' : 'failed to abstain on an unanswerable question',
      };
    },
  });
}

/** Options for {@link runLongMemEvalBenchmark}. */
export interface RunLongMemEvalOptions {
  readonly datasetPath: string;
  readonly loader?: LoaderName;
  readonly variant?: 'S' | 'M';
  /** Provider used by the system-under-test agent (and the judge unless overridden). */
  readonly provider: Provider;
  readonly judgeProvider?: Provider;
  /** Restrict to a single ability for per-category gates. */
  readonly ability?: MemoryEvalAbility;
  readonly smoke?: boolean;
  readonly topK?: number;
  readonly consolidate?: boolean;
  readonly concurrency?: number;
}

/** Run the benchmark and return the eval report (does not write RESULTS). */
export async function runLongMemEvalBenchmark(
  options: RunLongMemEvalOptions,
): Promise<EvalReport<MemoryEvalInput, string>> {
  const dataset = await loadDataset(options);
  let cases: Case<MemoryEvalInput, string>[] = [...dataset.cases];
  if (options.ability !== undefined) {
    cases = cases.filter((c) => c.input.ability === options.ability);
  }
  if (options.smoke === true) {
    cases = cases.slice(0, 3);
  }
  const agent = createMemorySystemAgent({
    provider: options.provider,
    ...(options.topK !== undefined ? { topK: options.topK } : {}),
    ...(options.consolidate !== undefined ? { consolidate: options.consolidate } : {}),
  });
  return runEvals<MemoryEvalInput, string>({
    agent,
    dataset: { cases },
    scorers: [judgeScorer(options.judgeProvider ?? options.provider), abstentionScorer()],
    concurrency: options.concurrency ?? 1,
  });
}

async function loadDataset(
  options: RunLongMemEvalOptions,
): Promise<Dataset<MemoryEvalInput, string>> {
  const loader = options.loader ?? 'longmemeval';
  if (loader === 'locomo') return loadLocomoDataset({ path: options.datasetPath });
  if (loader === 'dmr') return loadDmrDataset({ path: options.datasetPath });
  return loadLongMemEvalDataset({
    path: options.datasetPath,
    ...(options.variant !== undefined ? { variant: options.variant } : {}),
  });
}

interface CliArgs {
  dataset: string;
  loader: LoaderName;
  variant?: 'S' | 'M';
  ability?: MemoryEvalAbility;
  smoke: boolean;
  results: string;
  baseline?: string;
  json?: string;
  topK?: number;
  consolidate: boolean;
  gateOn: 'all' | 'regressions';
}

function pkgRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

function parseArgs(argv: ReadonlyArray<string>): CliArgs {
  const args: CliArgs = {
    dataset: join(pkgRoot(), 'data', 'fixture.json'),
    loader: 'longmemeval',
    smoke: false,
    results: join(pkgRoot(), 'RESULTS.md'),
    consolidate: false,
    gateOn: 'all',
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === '--dataset' && next !== undefined) {
      args.dataset = next;
      i++;
    } else if (a === '--loader' && next !== undefined) {
      args.loader = next as LoaderName;
      i++;
    } else if (a === '--variant' && next !== undefined) {
      args.variant = next as 'S' | 'M';
      i++;
    } else if (a === '--ability' && next !== undefined) {
      args.ability = next as MemoryEvalAbility;
      i++;
    } else if (a === '--results' && next !== undefined) {
      args.results = next;
      i++;
    } else if (a === '--baseline' && next !== undefined) {
      args.baseline = next;
      i++;
    } else if (a === '--json' && next !== undefined) {
      args.json = next;
      i++;
    } else if (a === '--top-k' && next !== undefined) {
      args.topK = Number.parseInt(next, 10);
      i++;
    } else if (a === '--gate-on' && next !== undefined) {
      args.gateOn = next === 'regressions' ? 'regressions' : 'all';
      i++;
    } else if (a === '--smoke') {
      args.smoke = true;
    } else if (a === '--consolidate') {
      args.consolidate = true;
    }
  }
  return args;
}

async function writeResults(
  resultsPath: string,
  report: EvalReport<MemoryEvalInput, string>,
): Promise<void> {
  const header = [
    '# LongMemEval — memory-quality benchmark results',
    '',
    `**Graphorin** v${VERSION} · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>`,
    '',
    `_Generated: ${new Date().toISOString()}_`,
    '',
  ].join('\n');
  await mkdir(dirname(resultsPath), { recursive: true });
  await writeFile(resultsPath, `${header}${renderMarkdownReport(report)}`, 'utf8');
}

export async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  console.warn(
    '[benchmark-longmemeval] no Provider injected; using the deterministic offline stub — ' +
      'scores are plumbing-only. Call runLongMemEvalBenchmark({ provider }) with a real ' +
      'Provider for meaningful numbers.',
  );
  const provider = createDefaultStubProvider();
  const report = await runLongMemEvalBenchmark({
    datasetPath: args.dataset,
    loader: args.loader,
    ...(args.variant !== undefined ? { variant: args.variant } : {}),
    ...(args.ability !== undefined ? { ability: args.ability } : {}),
    smoke: args.smoke,
    ...(args.topK !== undefined ? { topK: args.topK } : {}),
    consolidate: args.consolidate,
    provider,
  });
  console.log(
    `[benchmark-longmemeval] loader=${args.loader}${args.ability !== undefined ? ` ability=${args.ability}` : ''} ` +
      `cases=${report.summary.total} passed=${report.summary.passed} failed=${report.summary.failed} ` +
      `avgMs=${report.summary.avgDurationMs.toFixed(2)}`,
  );
  await writeResults(args.results, report);
  if (args.json !== undefined) {
    await writeFile(args.json, JSON.stringify(report, null, 2), 'utf8');
    console.log(`[benchmark-longmemeval] wrote JSON report to ${args.json}`);
  }

  let regression: RegressionReport<MemoryEvalInput, string> | undefined;
  if (args.baseline !== undefined) {
    let baselineText: string | undefined;
    try {
      baselineText = await readFile(args.baseline, 'utf8');
    } catch {
      console.warn(
        `[benchmark-longmemeval] no baseline at ${args.baseline} — skipping regression gate ` +
          '(seed one with --json).',
      );
    }
    if (baselineText !== undefined) {
      const baseline = JSON.parse(baselineText) as EvalReport<MemoryEvalInput, string>;
      regression = detectRegressions(report, baseline, {
        maxPassRateDropPct: 5,
        maxAvgScoreDrop: 0.05,
        // Quality-only gate: real LLM latency swings by whole seconds run to
        // run, so an absolute avg-duration budget would only produce flaky
        // failures here. Explicit even though Infinity is now the default (EB-4).
        maxAvgDurationIncreaseMs: Number.POSITIVE_INFINITY,
      });
      if (regression.hasRegressions) {
        console.error('[benchmark-longmemeval] REGRESSIONS DETECTED:');
        for (const f of regression.findings) console.error(`  - ${f.message}`);
      }
    }
  }
  // `all` (default) fails on any failed case or regression; `regressions`
  // gates only on the baseline comparison (used by the dispatch CI job, where
  // a placeholder provider may legitimately fail individual cases).
  if (args.gateOn === 'regressions') {
    if (regression?.hasRegressions === true) process.exitCode = 1;
  } else {
    exitOnFailures(report, regression);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
