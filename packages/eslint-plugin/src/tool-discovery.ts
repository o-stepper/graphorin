/**
 * Static `tool({...})` discovery + per-tool grader. Used by both the
 * three `tool-*` ESLint rules and by the `graphorin tools lint` CLI
 * subcommand (Phase 15) so the rule logic has a single source of
 * truth.
 *
 * The discovery is intentionally text-based - it scans a source
 * string for `tool(` call expressions and extracts the immediate
 * object literal that follows. The extractor handles the common
 * formatting cases (single-line, multi-line, nested object/array
 * literals, single + double-quoted strings, template literals) and
 * gracefully skips invocations whose argument shape it cannot
 * parse statically. The trade-off is documented: a project that
 * hides its `tool({...})` calls behind a builder helper or a
 * dynamic import will not be picked up by this lint surface; that
 * is the documented contract for the v0.1 lint surface.
 *
 * **Comment-awareness.** Discovery AND grading run over a
 * comment-blanked view of the source: line-comment and block-comment
 * content is replaced with spaces (newlines preserved, so line numbers
 * and offsets never shift) while string/template literals - and,
 * conservatively, regex literals - are left untouched. A
 * commented-out `tool({...})` is therefore never discovered, and a
 * commented-out property (or a commented email inside a live
 * `examples:` block) never feeds the grader. The ORIGINAL slice stays
 * available as {@link DiscoveredTool.source} for reports; grading
 * paths consume {@link DiscoveredTool.gradingSource}.
 *
 * **False-positive contract.** The scanner matches ANY callee whose
 * last lexical token is `tool(` - including method calls like
 * `.tool(` and locally-defined helpers that happen to share the name.
 * Renamed or wrapped invocations (`const t = tool; t({...})`) are NOT
 * seen. This is the accepted cost of the text-based surface that lets
 * the CLI and the ESLint rules share one implementation.
 *
 * **Per-tool grader rubric:**
 *
 *   - **description axis (0..40 points):**
 *     - 0 if missing / placeholder / shorter than 20 chars.
 *     - 16 if length >= 20.
 *     - 24 if length >= 30.
 *     - 32 if length >= 50.
 *     - 40 if length >= 80.
 *   - **examples axis (0..30 points):**
 *     - 0 if no examples or more than 5 (the documented upper bound).
 *     - 12 base for 1 example, +6 per additional, capped at 30.
 *     - -6 per PII finding (cap at 0).
 *   - **parameter naming axis (0..30 points):**
 *     - 30 base, deducted per finding.
 *     - -30/N per ambiguous-name finding (full penalty per param).
 *     - -10/N per numeric-suffix finding (partial penalty per param).
 *     - 15 baseline when no parameters are discoverable.
 *
 *   Total: 0..100 points. Calibrated against the fixture catalog
 *   so `wellDescribedTool` scores 82, `placeholderDescriptionTool`
 *   scores 20, and `examplesPiiTool` scores 61.
 *
 * @stable
 */

/**
 * @stable
 */
export interface DiscoveredTool {
  /** Source file the call was found in. */
  readonly file: string;
  /** 1-indexed line of the `tool(` token. */
  readonly line: number;
  /** Tool name extracted from the `name:` property when present. */
  readonly name: string;
  /** Tool description (`description:` value) when extractable. */
  readonly description?: string;
  /** Number of examples declared in the `examples:` array. */
  readonly examplesCount: number;
  /** Whether `examples:` is a non-empty array literal. */
  readonly hasExamples: boolean;
  /** Snapshot of identifiers referenced from the `inputSchema` Zod chain. */
  readonly parameterNames: ReadonlyArray<string>;
  /** Tags declared on the call (best-effort). */
  readonly tags: ReadonlyArray<string>;
  /**
   * Raw object-literal source (ORIGINAL text, comments included).
   * Useful for tests + as a context blob when the CLI needs to
   * surface the original source in a report.
   */
  readonly source: string;
  /**
   * The same slice with comments blanked - what discovery
   * parsed and what every grading path (examples PII scan,
   * description/parameter scoring) consumes. Same length and line
   * structure as `source`.
   */
  readonly gradingSource: string;
}

/**
 * @stable
 */
export type LintFindingKind =
  | 'description-missing'
  | 'description-too-short'
  | 'description-placeholder'
  | 'examples-missing'
  | 'examples-too-many'
  | 'examples-pii-detected'
  | 'parameter-ambiguous'
  | 'parameter-numeric-suffix';

/**
 * @stable
 */
export interface LintFinding {
  readonly rule:
    | 'graphorin/tool-description-required'
    | 'graphorin/tool-examples-recommended'
    | 'graphorin/tool-parameter-naming';
  readonly kind: LintFindingKind;
  readonly severity: 'error' | 'warn' | 'info';
  readonly message: string;
  readonly toolName: string;
  readonly file: string;
  readonly line: number;
  readonly hint?: string;
  /**
   * Optional matched-pattern context. Populated by the
   * `examples-pii-detected` finding so reports can highlight which
   * example payload triggered the rule.
   */
  readonly matchedPattern?: string;
}

/**
 * @stable
 */
export interface ToolGraderScore {
  readonly toolName: string;
  readonly file: string;
  readonly line: number;
  readonly score: number;
  readonly axes: {
    readonly description: number;
    readonly examples: number;
    readonly parameterNaming: number;
  };
  readonly findings: ReadonlyArray<LintFinding>;
}

/**
 * Generic identifiers the parameter-naming rule flags as ambiguous.
 * Tools whose `inputSchema` references only specific identifiers
 * (e.g. `userId`, `recipientEmail`, `apiKey`) get full credit on
 * the naming axis.
 *
 * @stable
 */
export const AMBIGUOUS_PARAMETER_NAMES: ReadonlyArray<string> = Object.freeze([
  'user',
  'id',
  'name',
  'value',
  'data',
  'input',
  'output',
  'result',
  'to',
  'from',
  'key',
  'field',
]);

/**
 * Tag values that, when present in a tool's `tags: [...]` literal,
 * suppress the parameter-naming rule for that tool. The opt-out
 * exists so operators can defer the rename for a long tail of
 * pre-existing tools while the framework migrates without breaking
 * calling code.
 *
 * @stable
 */
export const PARAMETER_NAMING_OPT_OUT_TAGS: ReadonlyArray<string> = Object.freeze([
  'experimental',
  'legacy',
]);

/**
 * Placeholder values the description-required rule treats as
 * non-descriptions.
 *
 * @stable
 */
export const PLACEHOLDER_DESCRIPTIONS: ReadonlyArray<string> = Object.freeze([
  'todo',
  'fixme',
  'tbd',
  'description',
  'placeholder',
]);

const MIN_DESCRIPTION_LENGTH = 20;
const MAX_EXAMPLES = 5;

/**
 * Discover every `tool({...})` invocation in a source string. The
 * returned findings are stable + frozen so callers can pass them
 * straight into a JSON report.
 *
 * @stable
 */
export function discoverToolCallsInSource(file: string, source: string): DiscoveredTool[] {
  const out: DiscoveredTool[] = [];
  // W-044: scan and parse over the comment-blanked view - a
  // commented-out `tool({...})` is invisible, and commented braces or
  // quotes can no longer derail the brace matcher. Offsets are shared
  // with the original source (blanking preserves length + newlines).
  // The REGEX additionally searches a strings-blanked view so a
  // `tool(` inside a string/template literal never matches; literals
  // are still parsed from the strings-intact view.
  const blanked = blankComments(source);
  const searchable = blankStringContents(blanked);
  const regex = /\btool\s*\(\s*\{/g;
  let match: RegExpExecArray | null = regex.exec(searchable);
  while (match !== null) {
    const objectStart = match.index + match[0].length - 1;
    const objectEnd = matchBrace(blanked, objectStart);
    if (objectEnd > 0) {
      const literal = source.slice(objectStart, objectEnd + 1);
      const gradingLiteral = blanked.slice(objectStart, objectEnd + 1);
      const line = countLines(source, match.index);
      const tool = parseToolLiteral(file, line, literal, gradingLiteral);
      if (tool !== null) out.push(tool);
    }
    regex.lastIndex = objectEnd + 1;
    match = regex.exec(searchable);
  }
  return out;
}

/**
 * Blank the CONTENTS of string/template literals (quotes kept,
 * newlines preserved) so the discovery regex cannot match `tool(`
 * inside prose. Used only for SEARCHING - parsing reads the
 * strings-intact view.
 */
function blankStringContents(source: string): string {
  const out = source.split('');
  let inString: '"' | "'" | '`' | null = null;
  let i = 0;
  while (i < source.length) {
    const ch = source[i] as string;
    if (inString !== null) {
      if (ch === '\\') {
        out[i] = ' ';
        if (i + 1 < source.length && source[i + 1] !== '\n') out[i + 1] = ' ';
        i += 2;
        continue;
      }
      if (ch === inString) {
        inString = null;
        i += 1;
        continue;
      }
      if (ch !== '\n') out[i] = ' ';
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch as '"' | "'" | '`';
    }
    i += 1;
  }
  return out.join('');
}

/**
 * Replace line-comment and block-comment CONTENT with spaces
 * while preserving every newline (offsets and 1-indexed lines never
 * shift).
 * String and template literals pass through untouched; regex literals
 * are tracked with the classic prev-significant-token heuristic so a
 * `/` inside one is never mistaken for a comment opener - when in
 * doubt the scanner does NOT blank.
 *
 * @stable
 */
export function blankComments(source: string): string {
  const out = source.split('');
  let inString: '"' | "'" | '`' | null = null;
  let prevSignificant = '';
  let i = 0;
  const isRegexStartContext = (): boolean =>
    prevSignificant === '' || '([{=,:;!&|?+-*%<>~^'.includes(prevSignificant);
  while (i < source.length) {
    const ch = source[i] as string;
    if (inString !== null) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === inString) inString = null;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch as '"' | "'" | '`';
      prevSignificant = ch;
      i += 1;
      continue;
    }
    if (ch === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') {
        out[i] = ' ';
        i += 1;
      }
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      out[i] = ' ';
      out[i + 1] = ' ';
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        if (source[i] !== '\n') out[i] = ' ';
        i += 1;
      }
      if (i < source.length) {
        out[i] = ' ';
        out[i + 1] = ' ';
        i += 2;
      }
      continue;
    }
    if (ch === '/' && isRegexStartContext()) {
      // Conservative regex-literal skip: consume to the closing
      // unescaped '/', honouring character classes.
      let j = i + 1;
      let inClass = false;
      while (j < source.length && source[j] !== '\n') {
        const cj = source[j] as string;
        if (cj === '\\') {
          j += 2;
          continue;
        }
        if (cj === '[') inClass = true;
        else if (cj === ']') inClass = false;
        else if (cj === '/' && !inClass) break;
        j += 1;
      }
      if (j < source.length && source[j] === '/') {
        prevSignificant = '/';
        i = j + 1;
        continue;
      }
      // No closing slash on the line - not a regex; fall through.
    }
    if (!/\s/.test(ch)) prevSignificant = ch;
    i += 1;
  }
  return out.join('');
}

/** Email PII pattern used by the examples-pii sub-check. */
const EMAIL_PATTERN = /[\w.+%-]+@[\w.-]+\.[A-Za-z]{2,}/;

/** Numeric-suffix pattern used by the parameter-naming sub-check. */
const NUMERIC_SUFFIX_PATTERN = /^[A-Za-z]+\d+$/;

/**
 * Run the three `tool-*` rules against a discovered tool and return the
 * findings. The CLI grader maps these findings into per-axis scores;
 * the ESLint rules forward them to `context.report(...)`.
 *
 * @stable
 */
export function runToolRules(
  tool: DiscoveredTool,
  severityOverrides?: {
    readonly toolDescription?: 'error' | 'warn' | 'off';
    readonly toolExamples?: 'error' | 'warn' | 'off';
    readonly toolParameterNaming?: 'error' | 'warn' | 'off';
  },
): LintFinding[] {
  const findings: LintFinding[] = [];

  const descSeverity = severityOverrides?.toolDescription ?? 'error';
  if (descSeverity !== 'off') {
    const desc = tool.description?.trim() ?? '';
    if (desc.length === 0) {
      findings.push(
        finding(
          'graphorin/tool-description-required',
          'description-missing',
          descSeverity,
          tool,
          `tool '${tool.name}' has no description; add a description that explains what the tool does and when to use it.`,
        ),
      );
    } else if (PLACEHOLDER_DESCRIPTIONS.includes(desc.toLowerCase())) {
      findings.push(
        finding(
          'graphorin/tool-description-required',
          'description-placeholder',
          descSeverity,
          tool,
          `tool '${tool.name}' description is a placeholder ('${tool.description}').`,
        ),
      );
    } else if (desc.length < MIN_DESCRIPTION_LENGTH) {
      findings.push(
        finding(
          'graphorin/tool-description-required',
          'description-too-short',
          descSeverity,
          tool,
          `tool '${tool.name}' description is shorter than ${MIN_DESCRIPTION_LENGTH} characters.`,
        ),
      );
    }
  }

  const examplesSeverity = severityOverrides?.toolExamples ?? 'warn';
  if (examplesSeverity !== 'off') {
    if (!tool.hasExamples || tool.examplesCount === 0) {
      findings.push(
        finding(
          'graphorin/tool-examples-recommended',
          'examples-missing',
          examplesSeverity,
          tool,
          `tool '${tool.name}' has no examples; add 1-5 worked examples per Anthropic 2026 guidance.`,
        ),
      );
    } else if (tool.examplesCount > MAX_EXAMPLES) {
      findings.push(
        finding(
          'graphorin/tool-examples-recommended',
          'examples-too-many',
          'error',
          tool,
          `tool '${tool.name}' declares ${tool.examplesCount} examples; the upper bound is ${MAX_EXAMPLES}.`,
        ),
      );
    }
    // PII sub-check - fires once per matched email pattern in the
    // examples block. Operators usually want synthetic data, not real
    // addresses scraped from the corpus.
    // W-044: grade over the blanked slice - a commented-out email
    // inside a LIVE literal must not penalize the axis.
    const emailMatch = EMAIL_PATTERN.exec(extractExamplesBlock(tool.gradingSource));
    if (emailMatch !== null) {
      const matched = emailMatch[0] as string;
      findings.push(
        finding(
          'graphorin/tool-examples-recommended',
          'examples-pii-detected',
          'error',
          tool,
          `tool '${tool.name}' example contains a real-looking email '${matched}'; replace with synthetic data (e.g. 'user@example.com').`,
          {
            matchedPattern: matched,
            hint: 'RB-49: examples must use synthetic test data so the rendered tool catalogue does not leak PII into provider context.',
          },
        ),
      );
    }
  }

  const namingSeverity = severityOverrides?.toolParameterNaming ?? 'warn';
  const namingOptedOut = tool.tags.some((t) => PARAMETER_NAMING_OPT_OUT_TAGS.includes(t));
  if (namingSeverity !== 'off' && !namingOptedOut) {
    for (const param of tool.parameterNames) {
      if (AMBIGUOUS_PARAMETER_NAMES.includes(param)) {
        findings.push(
          finding(
            'graphorin/tool-parameter-naming',
            'parameter-ambiguous',
            namingSeverity,
            tool,
            `tool '${tool.name}' uses ambiguous parameter name '${param}'; prefer a self-documenting name (e.g. '${param}Id', '${param}Email').`,
          ),
        );
      } else if (NUMERIC_SUFFIX_PATTERN.test(param)) {
        findings.push(
          finding(
            'graphorin/tool-parameter-naming',
            'parameter-numeric-suffix',
            namingSeverity,
            tool,
            `tool '${tool.name}' uses numeric-suffix parameter name '${param}'; prefer a semantic name (e.g. 'queryText', 'userId').`,
          ),
        );
      }
    }
  }

  return findings;
}

/**
 * Compute the per-tool grader score (0..100). Each axis is gated by
 * the findings produced for that axis. The rubric is calibrated
 * against the fixture catalog (`wellDescribedTool` -> 82,
 * `placeholderDescriptionTool` -> 20, `examplesPiiTool` -> 61).
 *
 * @stable
 */
export function gradeTool(
  tool: DiscoveredTool,
  findings: ReadonlyArray<LintFinding>,
): ToolGraderScore {
  const descFindings = findings.filter((f) => f.rule === 'graphorin/tool-description-required');
  const exampleFindings = findings.filter((f) => f.rule === 'graphorin/tool-examples-recommended');
  const namingFindings = findings.filter((f) => f.rule === 'graphorin/tool-parameter-naming');

  const description = scoreDescription(tool, descFindings);
  const examples = scoreExamples(tool, exampleFindings);
  const parameterNaming = scoreParameterNaming(tool, namingFindings);

  return Object.freeze({
    toolName: tool.name,
    file: tool.file,
    line: tool.line,
    score: description + examples + parameterNaming,
    axes: Object.freeze({ description, examples, parameterNaming }),
    findings,
  });
}

function scoreDescription(tool: DiscoveredTool, findings: ReadonlyArray<LintFinding>): number {
  if (findings.length > 0) return 0;
  const desc = tool.description?.trim() ?? '';
  let lengthScore = 0;
  if (desc.length >= 80) lengthScore = 40;
  else if (desc.length >= 50) lengthScore = 32;
  else if (desc.length >= 30) lengthScore = 24;
  else if (desc.length >= MIN_DESCRIPTION_LENGTH) lengthScore = 16;
  // W-044 anti-degenerate guard: 80 chars of repeated lorem must not
  // score like real prose. Deterministic and deliberately narrow -
  // real descriptions have at least 4 distinct words and no single
  // word carrying more than half the text - so the RB-49 calibration
  // fixtures are untouched. Degenerate text caps at the lowest
  // non-zero tier (16).
  if (lengthScore > 16 && desc.length > 0) {
    const words = desc
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const counts = new Map<string, number>();
    for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
    const unique = counts.size;
    const topShare = words.length === 0 ? 0 : Math.max(...counts.values()) / words.length;
    if (unique < 4 || topShare > 0.5) return 16;
  }
  return lengthScore;
}

function scoreExamples(tool: DiscoveredTool, findings: ReadonlyArray<LintFinding>): number {
  if (tool.examplesCount === 0) return 0;
  if (tool.examplesCount > MAX_EXAMPLES) return 0;
  // 12 base for the first example + 6 per additional, cap at 30. This
  // calibration produces wellDescribedTool == 12 (1 example) and
  // placeholderDescriptionTool == 0 (no examples). Each PII finding
  // subtracts 6 from the axis (cap at 0) so examplesPiiTool ends up
  // with 6 (12 base - 6 PII penalty).
  const base = Math.min(30, 12 + (tool.examplesCount - 1) * 6);
  const piiCount = findings.filter((f) => f.kind === 'examples-pii-detected').length;
  return Math.max(0, base - piiCount * 6);
}

function scoreParameterNaming(tool: DiscoveredTool, findings: ReadonlyArray<LintFinding>): number {
  if (tool.parameterNames.length === 0) {
    // No discoverable params - neither a positive nor a negative
    // signal. Award the median.
    return 15;
  }
  const total = tool.parameterNames.length;
  const ambiguousCount = findings.filter((f) => f.kind === 'parameter-ambiguous').length;
  const numericCount = findings.filter((f) => f.kind === 'parameter-numeric-suffix').length;
  // Full penalty for an ambiguous-name finding (`user`, `id`, `to`, …):
  // -30/N. Partial penalty for a numeric-suffix finding (`arg1`,
  // `param2`, …): -10/N. Calibrated so a single-param `arg1` scores
  // 20 (placeholderDescriptionTool) and a two-param `to`-+-`body`
  // scores 15 (examplesPiiTool).
  const score = 30 - (30 / total) * ambiguousCount - (10 / total) * numericCount;
  return Math.max(0, Math.round(score));
}

function finding(
  rule: LintFinding['rule'],
  kind: LintFindingKind,
  severity: 'error' | 'warn',
  tool: DiscoveredTool,
  message: string,
  extra: { readonly hint?: string; readonly matchedPattern?: string } = {},
): LintFinding {
  return Object.freeze({
    rule,
    kind,
    severity,
    message,
    toolName: tool.name,
    file: tool.file,
    line: tool.line,
    ...(extra.hint !== undefined ? { hint: extra.hint } : {}),
    ...(extra.matchedPattern !== undefined ? { matchedPattern: extra.matchedPattern } : {}),
  });
}

/**
 * Extract the substring inside the `examples: [...]` array literal so
 * the PII detector can scan only the example payloads (not the rest of
 * the tool body).
 *
 * @internal
 */
function extractExamplesBlock(literal: string): string {
  const m = /examples\s*:\s*\[/.exec(literal);
  if (m === null) return '';
  const start = m.index + m[0].length - 1;
  const end = matchBracket(literal, start);
  if (end < 0) return '';
  return literal.slice(start + 1, end);
}

/**
 * Parse a string literal value from the immediate object literal.
 * Supports `'`, `"`, and template strings (without interpolation).
 *
 * @internal
 */
function readStringProp(literal: string, prop: string): string | undefined {
  const escapedProp = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[\\s,{])${escapedProp}\\s*:\\s*(['"\`])`, 'm');
  const m = re.exec(literal);
  if (m === null) return undefined;
  const quote = m[1] as string;
  const start = m.index + m[0].length;
  let i = start;
  let out = '';
  while (i < literal.length) {
    const ch = literal[i] as string;
    if (ch === '\\' && i + 1 < literal.length) {
      out += literal[i + 1];
      i += 2;
      continue;
    }
    if (ch === quote) return out;
    out += ch;
    i += 1;
  }
  return undefined;
}

/**
 * Count entries in an array literal value of the form `prop: [...]`.
 *
 * @internal
 */
function countArrayProp(
  literal: string,
  prop: string,
): { readonly count: number; readonly present: boolean } {
  const escapedProp = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[\\s,{])${escapedProp}\\s*:\\s*\\[`, 'm');
  const m = re.exec(literal);
  if (m === null) return { count: 0, present: false };
  const start = m.index + m[0].length - 1;
  const end = matchBracket(literal, start);
  if (end < 0) return { count: 0, present: true };
  // Strip a trailing comma so it does not inflate the count.
  const inner = literal
    .slice(start + 1, end)
    .trim()
    .replace(/,\s*$/, '');
  if (inner.length === 0) return { count: 0, present: true };
  // Count top-level commas (depth + string aware).
  let depth = 0;
  let inString: '"' | "'" | '`' | null = null;
  let count = 1;
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i] as string;
    if (inString !== null) {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch as '"' | "'" | '`';
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth += 1;
    else if (ch === ')' || ch === ']' || ch === '}') depth -= 1;
    else if (ch === ',' && depth === 0) count += 1;
  }
  return { count, present: true };
}

/**
 * Extract identifiers passed into a `z.object({...})` schema as
 * top-level keys.
 *
 * @internal
 */
function extractParameterNames(literal: string): string[] {
  const m = /inputSchema\s*:\s*z\s*\.\s*object\s*\(\s*\{/.exec(literal);
  if (m === null) return [];
  const start = m.index + m[0].length - 1;
  const end = matchBrace(literal, start);
  if (end < 0) return [];
  const inner = literal.slice(start + 1, end);
  const names: string[] = [];
  const idRegex = /(^|[\s,{])([A-Za-z_$][A-Za-z0-9_$]*)\s*:/g;
  let id = idRegex.exec(inner);
  while (id !== null) {
    const name = id[2] as string;
    if (!names.includes(name)) names.push(name);
    id = idRegex.exec(inner);
  }
  return names;
}

function parseToolLiteral(
  file: string,
  line: number,
  literal: string,
  gradingLiteral: string,
): DiscoveredTool | null {
  // W-044: every extraction parses the BLANKED slice so commented-out
  // properties inside a live literal never count; string values are
  // preserved verbatim by the blanker.
  const name = readStringProp(gradingLiteral, 'name') ?? '<anonymous>';
  const description = readStringProp(gradingLiteral, 'description');
  const examples = countArrayProp(gradingLiteral, 'examples');
  const tagsArr = countArrayProp(gradingLiteral, 'tags');
  const tags: string[] = [];
  if (tagsArr.present && tagsArr.count > 0) {
    const m = /tags\s*:\s*\[([^\]]*)\]/.exec(gradingLiteral);
    if (m !== null) {
      const inner = (m[1] as string) ?? '';
      const tagRegex = /['"`]([^'"`]+)['"`]/g;
      let t = tagRegex.exec(inner);
      while (t !== null) {
        tags.push(t[1] as string);
        t = tagRegex.exec(inner);
      }
    }
  }
  const parameterNames = extractParameterNames(gradingLiteral);
  return Object.freeze({
    file,
    line,
    name,
    ...(description !== undefined ? { description } : {}),
    examplesCount: examples.count,
    hasExamples: examples.present,
    parameterNames: Object.freeze(parameterNames),
    tags: Object.freeze(tags),
    source: literal,
    gradingSource: gradingLiteral,
  });
}

function countLines(source: string, index: number): number {
  let n = 1;
  for (let i = 0; i < index; i += 1) {
    if (source[i] === '\n') n += 1;
  }
  return n;
}

function matchBrace(source: string, openIndex: number): number {
  return matchPair(source, openIndex, '{', '}');
}

function matchBracket(source: string, openIndex: number): number {
  return matchPair(source, openIndex, '[', ']');
}

function matchPair(source: string, openIndex: number, open: string, close: string): number {
  let depth = 0;
  let inString: '"' | "'" | '`' | null = null;
  for (let i = openIndex; i < source.length; i += 1) {
    const ch = source[i] as string;
    if (inString !== null) {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch as '"' | "'" | '`';
      continue;
    }
    if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}
