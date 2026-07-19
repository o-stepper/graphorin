/**
 * Tool result truncation pipeline.
 *
 * Four strategies - `'middle' | 'tail' | 'spill-to-file' |
 * 'summarize'` - all share the same outcome contract so the executor
 * downstream can route each branch through the same audit / counter
 * paths.
 *
 * The annotation tokens are bytes-stable AND calibrated to NOT match
 * any imperative-pattern from the inbound sanitization catalogue, so
 * the downstream sanitization scan does not false-positive on the
 * truncation marker.
 *
 * @packageDocumentation
 */

import path from 'node:path';
import type { TruncationStrategy } from '@graphorin/core';
import { type ImperativePattern, scanImperativePatterns } from '@graphorin/observability/redaction';

/**
 * Pluggable token counter used by the truncation pipeline. Defaults
 * to {@link countTokensHeuristic} (4 chars per token) when no custom
 * counter is supplied; the agent runtime injects the per-provider
 * counter from `@graphorin/provider/counters`.
 *
 * @stable
 */
export interface TokenCounter {
  count(text: string): number;
}

/**
 * Heuristic token counter - 4 chars per token. Matches the
 * fall-through behaviour the agent runtime applies when a per-
 * provider counter is unavailable (offline development; tests).
 *
 * @stable
 */
export const countTokensHeuristic: TokenCounter = Object.freeze({
  count(text: string): number {
    return Math.ceil(text.length / 4);
  },
});

/**
 * Outcome of {@link truncateBody}. Carries the truncated body and
 * the metadata the audit emitter writes into the
 * `tool:result:truncated` row.
 *
 * @stable
 */
export interface TruncationOutcome {
  readonly truncated: boolean;
  readonly body: string;
  readonly originalTokens: number;
  readonly keptTokens: number;
  readonly droppedTokens: number;
  readonly strategyApplied: TruncationStrategy;
  /** Path of the spill artifact (only set for `'spill-to-file'`). */
  readonly artifactPath?: string;
  /** Bytes written to the spill artifact (only set for `'spill-to-file'`). */
  readonly artifactBytes?: number;
  /**
   * Opaque, run-scoped handle URI for the spill artifact - e.g.
   * `graphorin-spill:<runId>/<toolCallId>.<ext>` (only set for
   * `'spill-to-file'`). This is the model-facing reference embedded in the
   * truncation annotation; unlike {@link artifactPath} it carries no raw
   * filesystem path. Resolve it with `createFileResultReader` / the
   * built-in `read_result` tool.
   */
  readonly resultHandle?: string;
  /**
   * Result of the single spill-time imperative-pattern scan
   * over the FULL body (only set for `'spill-to-file'`, and only when
   * the scan completed within budget). `true` means the artifact
   * contains at least one catalogued imperative pattern - including
   * one a future `read_result` page boundary would split, which the
   * per-page strip pass cannot see. The executor stores it in the
   * handle taint map and the default writer persists it in the taint
   * sidecar.
   */
  readonly spillImperativePatternsPresent?: boolean;
  /** Model name of the summarizer (only set for `'summarize'`). */
  readonly summarizerModel?: string;
}

/**
 * Pluggable summarizer hook - the agent runtime supplies an
 * implementation backed by the consolidator-tier model. When absent
 * the `'summarize'` strategy gracefully degrades to `'middle'` and
 * records the fall-through on the outcome.
 *
 * @stable
 */
export interface ResultSummarizer {
  readonly model: string;
  summarize(
    body: string,
    opts: { readonly maxTokens: number; readonly signal?: AbortSignal },
  ): Promise<string>;
}

/**
 * Pluggable spill-to-file writer. The runtime injects an implementation
 * that knows the per-tool sandbox FS view (see DEC-148 sandbox tier
 * defaults).
 *
 * @stable
 */
export interface SpillWriter {
  readonly artifactRoot: string;
  write(opts: {
    readonly runId: string;
    readonly toolCallId: string;
    readonly extension: string;
    readonly body: string;
    readonly sensitivityTier?: string;
    /**
     * Trust class of the tool that produced this body.
     * Writers persist it (the default writer stores a
     * `<file>.meta.json` sidecar) so a reader in ANOTHER executor or a
     * resumed process can re-taint the content - without it, an
     * untrusted spill read back through the trusted `read_result`
     * built-in launders to trusted.
     */
    readonly producerTrustClass?: string;
    /**
     * Source of the producing tool (a JSON-serializable `ToolSource`
     * value), persisted alongside the trust class.
     */
    readonly producerSource?: unknown;
    /**
     * Whether the framework's single whole-artifact scan found
     * at least one catalogued imperative pattern in the FULL body
     * (including patterns a future `read_result` page boundary would
     * split, invisible to the per-page strip pass). The scan runs
     * framework-side in `spillToFile` for EVERY writer; PERSISTING the
     * flag is the writer's job, mirroring `producerTrustClass` /
     * `sensitivityTier` (the default writer stores it in the taint
     * sidecar). A custom writer that ignores this field loses only the
     * read-side flag (the operator counter on later page reads) - the
     * scan itself and the load-bearing defenses (per-page
     * untrusted-content envelope, producer taint) are unaffected.
     * Absent when the scan timed out (unknown is not `false`).
     */
    readonly imperativePatternsPresent?: boolean;
  }): Promise<{ readonly path: string; readonly bytes: number }>;
  /**
   * Remove every artifact of one run. The agent calls this when
   * a run ends `completed`/`failed`; `awaiting_approval` and `aborted`
   * runs keep theirs (handles must survive resume). Optional - custom
   * writers without it rely on the TTL sweep / external rotation.
   */
  clear?(runId: string): Promise<void>;
  /**
   * Remove run directories older than `ttlMs`. Returns the
   * number of run directories removed. The default writer fires one
   * best-effort sweep at construction (7-day TTL) to collect orphans.
   */
  sweep?(ttlMs: number): Promise<number>;
}

/**
 * Configuration for {@link truncateBody}.
 *
 * @stable
 */
export interface TruncateOptions {
  readonly counter?: TokenCounter;
  readonly summarizer?: ResultSummarizer;
  readonly spill?: SpillWriter;
  readonly runId?: string;
  readonly toolCallId?: string;
  readonly toolSensitivityTier?: string;
  /**
   * Effective trust class of the content's producer, forwarded to
   * {@link SpillWriter.write} so the artifact's taint survives process
   * / executor boundaries.
   */
  readonly producerTrustClass?: string;
  /**
   * Effective source of the content's producer (a JSON-serializable
   * `ToolSource` value; see {@link producerTrustClass}).
   */
  readonly producerSource?: unknown;
  /**
   * Pattern catalogue for the single scan over the FULL body at
   * spill time (defaults to the built-in catalogue). The per-page
   * strip pass in the executor cannot see a pattern split by a
   * `read_result` page boundary; this whole-artifact scan can.
   */
  readonly imperativePatterns?: ReadonlyArray<ImperativePattern>;
  /** Budget for the spill-time scan in milliseconds. Default `250`. */
  readonly imperativeBudgetMs?: number;
  readonly signal?: AbortSignal;
}

const ANNOTATION_PREFIX = '/* graphorin:result:truncated';
const ANNOTATION_SUFFIX = '*/';

/**
 * Apply the per-strategy truncation pipeline.
 *
 * @stable
 */
export async function truncateBody(opts: {
  readonly body: string;
  readonly maxTokens: number;
  readonly strategy: TruncationStrategy;
  readonly options?: TruncateOptions;
}): Promise<TruncationOutcome> {
  const counter = opts.options?.counter ?? countTokensHeuristic;
  const originalTokens = counter.count(opts.body);
  // `0` disables the cap entirely.
  if (opts.maxTokens === 0 || originalTokens <= opts.maxTokens) {
    return Object.freeze({
      truncated: false,
      body: opts.body,
      originalTokens,
      keptTokens: originalTokens,
      droppedTokens: 0,
      strategyApplied: opts.strategy,
    });
  }
  switch (opts.strategy) {
    case 'middle':
      return truncateMiddle(opts.body, opts.maxTokens, originalTokens, counter);
    case 'tail':
      return truncateTail(opts.body, opts.maxTokens, originalTokens, counter);
    case 'spill-to-file':
      return spillToFile(opts.body, opts.maxTokens, originalTokens, counter, opts.options);
    case 'summarize':
      return summarize(opts.body, opts.maxTokens, originalTokens, counter, opts.options);
  }
}

function truncateMiddle(
  body: string,
  maxTokens: number,
  originalTokens: number,
  counter: TokenCounter,
): TruncationOutcome {
  const annotation = renderAnnotation('middle', { originalTokens, keptTokens: maxTokens });
  const annotationTokens = counter.count(annotation);
  const slotTokens = Math.max(0, maxTokens - annotationTokens);
  const headBudget = Math.floor(slotTokens / 2);
  const tailBudget = Math.max(0, slotTokens - headBudget);
  const head = sliceByTokens(body, headBudget, counter, 'head');
  const tail = sliceByTokens(body, tailBudget, counter, 'tail');
  const output = `${head}\n${annotation}\n${tail}`;
  const keptTokens = counter.count(output);
  return Object.freeze({
    truncated: true,
    body: output,
    originalTokens,
    keptTokens,
    droppedTokens: Math.max(0, originalTokens - keptTokens),
    strategyApplied: 'middle',
  });
}

function truncateTail(
  body: string,
  maxTokens: number,
  originalTokens: number,
  counter: TokenCounter,
): TruncationOutcome {
  const annotation = renderAnnotation('tail', { originalTokens, keptTokens: maxTokens });
  const annotationTokens = counter.count(annotation);
  const slotTokens = Math.max(0, maxTokens - annotationTokens);
  const tail = sliceByTokens(body, slotTokens, counter, 'tail');
  const output = `${annotation}\n${tail}`;
  const keptTokens = counter.count(output);
  return Object.freeze({
    truncated: true,
    body: output,
    originalTokens,
    keptTokens,
    droppedTokens: Math.max(0, originalTokens - keptTokens),
    strategyApplied: 'tail',
  });
}

async function spillToFile(
  body: string,
  maxTokens: number,
  originalTokens: number,
  counter: TokenCounter,
  options: TruncateOptions | undefined,
): Promise<TruncationOutcome> {
  if (
    options === undefined ||
    options.spill === undefined ||
    options.runId === undefined ||
    options.toolCallId === undefined
  ) {
    // Spill writer / context not wired - gracefully fall back to 'middle'.
    return truncateMiddle(body, maxTokens, originalTokens, counter);
  }
  if (options.toolSensitivityTier === 'secret') {
    // WI-10 (P1-4) sensitivity gate: never externalise a secret-tier body
    // to the shared spill store. Truncate in place so the data stays in the
    // trusted conversation context and is never written to disk or surfaced
    // behind a (less-trusted) handle.
    return truncateMiddle(body, maxTokens, originalTokens, counter);
  }
  const extension = looksLikeJson(body) ? 'json' : 'txt';
  // W-156: single whole-artifact scan BEFORE any writer runs, so the
  // signal exists for custom `SpillWriter`s too (a scan inside the
  // default writer would silently vanish for injected writers). The
  // per-page strip pass in the executor scans each `read_result` page
  // independently, so an imperative pattern split by a page boundary
  // evades it in both halves - this scan sees the whole body while it
  // is still in memory. Best-effort like every pattern scan: a budget
  // timeout yields `undefined` (unknown), never a false `false`.
  const imperativeScan = scanImperativePatterns(
    body,
    options.imperativePatterns,
    options.imperativeBudgetMs ?? 250,
  );
  const imperativePatternsPresent =
    imperativeScan === null ? undefined : imperativeScan.hits.length > 0;
  const spill = await options.spill.write({
    runId: options.runId,
    toolCallId: options.toolCallId,
    extension,
    body,
    ...(options.toolSensitivityTier !== undefined
      ? { sensitivityTier: options.toolSensitivityTier }
      : {}),
    ...(options.producerTrustClass !== undefined
      ? { producerTrustClass: options.producerTrustClass }
      : {}),
    ...(options.producerSource !== undefined ? { producerSource: options.producerSource } : {}),
    ...(imperativePatternsPresent !== undefined ? { imperativePatternsPresent } : {}),
  });
  // Opaque, run-scoped handle URI relative to the writer's artifact root -
  // this, not the raw absolute path, is what the model sees in the
  // annotation (and what `read_result` resolves back). `artifactPath` is
  // retained on the outcome for the operator-facing spill audit row.
  const relative = path.relative(options.spill.artifactRoot, spill.path).split(path.sep).join('/');
  const handle = `graphorin-spill:${relative}`;
  const annotation = renderAnnotation('spill-to-file', {
    originalTokens,
    keptTokens: maxTokens,
    handle,
  });
  const annotationTokens = counter.count(annotation);
  const slotTokens = Math.max(0, maxTokens - annotationTokens);
  const head = sliceByTokens(body, slotTokens, counter, 'head');
  const output = `${head}\n${annotation}`;
  const keptTokens = counter.count(output);
  return Object.freeze({
    truncated: true,
    body: output,
    originalTokens,
    keptTokens,
    droppedTokens: Math.max(0, originalTokens - keptTokens),
    strategyApplied: 'spill-to-file',
    artifactPath: spill.path,
    artifactBytes: spill.bytes,
    resultHandle: handle,
    ...(imperativePatternsPresent !== undefined
      ? { spillImperativePatternsPresent: imperativePatternsPresent }
      : {}),
  });
}

async function summarize(
  body: string,
  maxTokens: number,
  originalTokens: number,
  counter: TokenCounter,
  options: TruncateOptions | undefined,
): Promise<TruncationOutcome> {
  if (options?.summarizer === undefined) {
    return truncateMiddle(body, maxTokens, originalTokens, counter);
  }
  const summary = await options.summarizer.summarize(body, {
    maxTokens,
    ...(options.signal !== undefined ? { signal: options.signal } : {}),
  });
  const annotation = renderAnnotation('summarize', {
    originalTokens,
    keptTokens: counter.count(summary),
    summarizerModel: options.summarizer.model,
  });
  const output = `${annotation}\n${summary}`;
  const keptTokens = counter.count(output);
  return Object.freeze({
    truncated: true,
    body: output,
    originalTokens,
    keptTokens,
    droppedTokens: Math.max(0, originalTokens - keptTokens),
    strategyApplied: 'summarize',
    summarizerModel: options.summarizer.model,
  });
}

function sliceByTokens(
  body: string,
  budget: number,
  counter: TokenCounter,
  end: 'head' | 'tail',
): string {
  if (budget <= 0) return '';
  // The heuristic counter is a strict char-count / 4 mapping, so we
  // can compute a char budget directly. For non-heuristic counters we
  // grow a window incrementally.
  if (counter === countTokensHeuristic) {
    const charBudget = Math.max(0, budget * 4);
    return end === 'head' ? body.slice(0, charBudget) : body.slice(-charBudget);
  }
  // Generic grow-window strategy.
  let lo = 0;
  let hi = body.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    const slice = end === 'head' ? body.slice(0, mid) : body.slice(-mid);
    if (counter.count(slice) > budget) {
      hi = mid - 1;
    } else {
      lo = mid;
    }
  }
  return end === 'head' ? body.slice(0, lo) : body.slice(-lo);
}

/**
 * An actionable next step for the model, not just "this was truncated".
 * An opaque annotation makes the model retry blindly or give up; a concrete
 * recovery path (narrow the request, or fetch the spilled handle) keeps the
 * self-correction loop productive.
 */
function truncationHint(strategy: TruncationStrategy): string {
  switch (strategy) {
    case 'middle':
    case 'tail':
      return ' re-run narrower (date range/filter/limit) for the omitted part';
    case 'spill-to-file':
      return ' full result via read_result(handle)';
    case 'summarize':
      return ' re-run narrower for verbatim detail';
    default:
      return '';
  }
}

function renderAnnotation(
  strategy: TruncationStrategy,
  meta: Readonly<Record<string, unknown>>,
): string {
  const fields = Object.entries(meta)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${formatValue(v)}`)
    .join(' ');
  return `${ANNOTATION_PREFIX} strategy=${strategy} ${fields}${truncationHint(strategy)} ${ANNOTATION_SUFFIX}`;
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  return String(value);
}

function looksLikeJson(body: string): boolean {
  const trimmed = body.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}
