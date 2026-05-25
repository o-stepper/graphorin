/**
 * Agentic / iterative retrieval for hard queries (P2-4) — a **gated**,
 * CRAG/Self-RAG-style grade-then-reformulate loop.
 *
 * Some multi-hop / temporal questions can't be answered from a single
 * retrieval pass; the naive system returns a confident-but-wrong answer
 * instead of retrieving again. This module adds a small loop: grade the
 * retrieved memories for sufficiency and, when weak, reformulate the
 * query and retrieve once more (optionally widening to the P2-1 graph) —
 * up to a hard iteration cap, then **abstain** rather than confabulate.
 *
 * Both CRAG (arXiv:2401.15884) and Self-RAG (arXiv:2310.11511) add
 * latency/cost, so the literature's advice — and this module's design —
 * is to *gate* the loop, not make it default:
 *
 *   1. A cheap, **local** {@link assessQueryDifficulty} heuristic decides
 *      whether a query is even a candidate; simple lookups never enter
 *      the loop (no provider call) and stay single-shot.
 *   2. The grade/reformulate step needs a {@link RetrievalGrader}; with
 *      none configured the loop degrades to a single retrieval pass. The
 *      only provider-backed grader, {@link createProviderRetrievalGrader},
 *      is **resilient**: any provider error or unparseable output degrades
 *      to a "stop" grade rather than throwing or looping forever.
 *   3. A mandatory iteration cap bounds the worst case regardless of the
 *      grader.
 *
 * The module is provider-agnostic — it imports only `@graphorin/core`
 * types and never performs I/O itself; {@link runIterativeRetrieval} is a
 * pure orchestrator over an injected `retrieve` function + grader, so the
 * loop is unit-testable without a store or a model.
 *
 * @packageDocumentation
 */

import type { Provider, ProviderRequest } from '@graphorin/core';

/** Default hard ceiling on total retrieval passes (gate + cap mandatory). */
export const DEFAULT_MAX_ITERATIONS = 3;

/**
 * Absolute clamp on total retrieval passes, applied regardless of the
 * caller's `maxIterations` — a latency guardrail so a mis-configured
 * caller can never unbound the loop.
 */
export const MAX_ITERATIONS_CEILING = 5;

/** Default score (0..1) at or above which a query is classified as hard. */
export const DEFAULT_DIFFICULTY_THRESHOLD = 0.5;

/** Default output-token ceiling for a single grade call. */
const DEFAULT_GRADE_MAX_TOKENS = 256;

/** Default number of retrieved snippets shown to the grader per pass. */
const DEFAULT_MAX_GRADE_SNIPPETS = 8;

// ---------------------------------------------------------------------------
// Difficulty gate (pure, local — no I/O, no provider)
// ---------------------------------------------------------------------------

/**
 * Outcome of the heuristic difficulty gate. `hard` is the gating
 * decision (`score >= threshold`); `signals` lists which heuristic
 * categories fired, for explainability / tracing.
 *
 * @stable
 */
export interface DifficultyAssessment {
  readonly hard: boolean;
  /** Aggregate difficulty score, clamped to `[0, 1]`. */
  readonly score: number;
  /** Heuristic categories that fired (`'multi-hop'`, `'temporal'`, …). */
  readonly signals: ReadonlyArray<string>;
}

/**
 * Tuning for {@link assessQueryDifficulty}.
 *
 * @stable
 */
export interface DifficultyGateOptions {
  /** Minimum score (0..1) to classify the query as hard. Default 0.5. */
  readonly threshold?: number;
}

/** Relational / referential markers implying a hop to another entity. */
const RE_REL_PRONOUN = /\b(?:who|whom|whose|which)\b/iu;
const RE_OF_CHAIN = /\bthe\s+\w+\s+of\b/iu;
const RE_POSSESSIVE = /\b[\w-]+'s\b/giu;
const RE_DESC_REF =
  /\bthe\s+(?:person|people|place|thing|one|company|team|book|restaurant|project|guy|woman|man)\b/iu;
/** Temporal ordering / relative-time markers. */
const RE_TEMPORAL =
  /\b(?:before|after|when|while|during|since|until|first|last|earliest|latest|previously|originally|ago|prior|then|recently|used\s+to)\b/iu;
/** Comparison / superlative markers. */
const RE_COMPARISON =
  /\b(?:most|least|more|less|fewer|greater|biggest|largest|smallest|oldest|newest|best|worst|highest|lowest|compared?|versus|vs\.?|between)\b/iu;
/** Clause-joining conjunctions used to count clauses. */
const RE_CONJUNCTION = /\b(?:and|or|but|then)\b/giu;

const W_MULTI_HOP = 0.4;
const W_TEMPORAL = 0.3;
const W_COMPARISON = 0.3;
const W_MULTI_CLAUSE = 0.2;
const W_LONG = 0.15;
const LONG_WORD_COUNT = 12;

/**
 * Score a query's retrieval difficulty with cheap, deterministic, fully
 * **local** heuristics (no I/O). Conservative by design — it prefers to
 * leave a query single-shot (`hard: false`) unless several
 * multi-hop / temporal / comparison signals stack up, so the gate adds
 * passes only where they are likely to help. Used by
 * {@link runIterativeRetrieval} to decide whether to enter the loop.
 *
 * @stable
 */
export function assessQueryDifficulty(
  query: string,
  options: DifficultyGateOptions = {},
): DifficultyAssessment {
  const threshold = options.threshold ?? DEFAULT_DIFFICULTY_THRESHOLD;
  const signals: string[] = [];
  let score = 0;

  const possessiveCount = (query.match(RE_POSSESSIVE) ?? []).length;
  const multiHop =
    RE_REL_PRONOUN.test(query) ||
    RE_OF_CHAIN.test(query) ||
    RE_DESC_REF.test(query) ||
    possessiveCount >= 2;
  if (multiHop) {
    signals.push('multi-hop');
    score += W_MULTI_HOP;
  }
  if (RE_TEMPORAL.test(query)) {
    signals.push('temporal');
    score += W_TEMPORAL;
  }
  if (RE_COMPARISON.test(query)) {
    signals.push('comparison');
    score += W_COMPARISON;
  }
  const clauseSignals = (query.match(RE_CONJUNCTION) ?? []).length + countCommas(query);
  if (clauseSignals >= 2 || questionMarkCount(query) >= 2) {
    signals.push('multi-clause');
    score += W_MULTI_CLAUSE;
  }
  if (wordCount(query) >= LONG_WORD_COUNT) {
    signals.push('long');
    score += W_LONG;
  }

  const clamped = Math.min(1, score);
  return { hard: clamped >= threshold, score: clamped, signals };
}

// ---------------------------------------------------------------------------
// Retrieval grader seam (provider-agnostic)
// ---------------------------------------------------------------------------

/**
 * Verdict from grading a retrieved candidate set against a query.
 *
 * @stable
 */
export interface RetrievalGrade {
  /** Whether the retrieved memories suffice to answer the query. */
  readonly sufficient: boolean;
  /** Grader confidence, clamped to `[0, 1]`. */
  readonly confidence: number;
  /**
   * A single better search query to try next, or `null` when the grader
   * proposes none (the loop then stops / abstains).
   */
  readonly reformulation: string | null;
  /** Optional short rationale (never surfaced in spans). */
  readonly reason?: string;
}

/**
 * Per-call options for a {@link RetrievalGrader}.
 *
 * @stable
 */
export interface RetrievalGradeOptions {
  /** Cancellation signal forwarded to the underlying provider call. */
  readonly signal?: AbortSignal;
}

/**
 * Pluggable retrieval-grader seam consumed by the iterative loop. The
 * built-in provider-backed implementation lives in
 * {@link createProviderRetrievalGrader}; advanced callers can supply a
 * bespoke grader (e.g. a deterministic heuristic).
 *
 * Implementations MUST degrade gracefully — return a "stop" grade rather
 * than throw — so a grader failure never breaks recall.
 *
 * @stable
 */
export interface RetrievalGrader {
  grade(
    query: string,
    snippets: ReadonlyArray<string>,
    options?: RetrievalGradeOptions,
  ): Promise<RetrievalGrade>;
}

/**
 * System prompt for the retrieval grader. Asks for a bare JSON verdict;
 * {@link parseGrade} also tolerates a chatty model.
 *
 * @internal
 */
export const RETRIEVAL_GRADE_SYSTEM_PROMPT =
  'You are a retrieval grader for a personal memory store. Given a question and a ' +
  'numbered list of retrieved memories, judge whether they are SUFFICIENT to answer ' +
  'the question correctly and completely. Respond with ONLY a JSON object: ' +
  '{"sufficient": boolean, "confidence": number between 0 and 1, "reformulation": ' +
  'string or null, "reason": string}. Set "sufficient" to true only if the memories ' +
  'actually contain the answer — do not guess. When insufficient, set "reformulation" ' +
  'to a single alternative search query likely to retrieve the missing information ' +
  '(vary entities, time frame, or specificity); otherwise null. Output only the JSON ' +
  'object — no prose, no markdown.';

/**
 * Build the grade request. Pure — no I/O. Temperature 0 so the verdict
 * is as stable as the model allows.
 *
 * @stable
 */
export function buildGradeRequest(
  query: string,
  snippets: ReadonlyArray<string>,
  options: { readonly maxTokens?: number; readonly signal?: AbortSignal } = {},
): ProviderRequest {
  const body =
    snippets.length === 0 ? '(none)' : snippets.map((s, i) => `[${i + 1}] ${s}`).join('\n');
  const content =
    `Question: ${query}\n\nRetrieved memories:\n${body}\n\n` +
    'Grade whether these memories are sufficient to answer the question. If not, ' +
    'propose a single better search query.';
  return {
    messages: [{ role: 'user', content }],
    systemMessage: RETRIEVAL_GRADE_SYSTEM_PROMPT,
    temperature: 0,
    maxTokens: options.maxTokens ?? DEFAULT_GRADE_MAX_TOKENS,
    ...(options.signal !== undefined ? { signal: options.signal } : {}),
    outputType: { kind: 'structured' },
  };
}

/**
 * Parse a grader model output into a {@link RetrievalGrade}. Tolerates a
 * bare JSON object, a fenced block, and chatty text around the object.
 *
 * **Fail-safe = stop.** When the verdict can't be read (undefined / empty
 * / unparseable / missing `sufficient`), returns
 * `{ sufficient: true, confidence: 0, reformulation: null }` so a broken
 * grader degrades to a single pass rather than looping or falsely
 * abstaining. A *parsed* `sufficient: false` (a real insufficiency
 * verdict) is preserved.
 *
 * @stable
 */
export function parseGrade(text: string | undefined): RetrievalGrade {
  const stop: RetrievalGrade = { sufficient: true, confidence: 0, reformulation: null };
  if (text === undefined) return stop;
  const stripped = stripFence(text).trim();
  if (stripped.length === 0) return stop;
  const obj = tryParseObject(stripped);
  if (obj === null) return stop;
  const sufficient = coerceBool(obj.sufficient);
  if (sufficient === null) return stop;
  const confidence = coerceConfidence(obj.confidence, sufficient);
  const reformulation = sufficient ? null : coerceReformulation(obj.reformulation);
  const reason = coerceReason(obj.reason);
  return {
    sufficient,
    confidence,
    reformulation,
    ...(reason !== undefined ? { reason } : {}),
  };
}

/**
 * Wrap a {@link Provider} as a {@link RetrievalGrader}. **Resilient**: a
 * provider error or unparseable response degrades to the
 * {@link parseGrade} "stop" grade so grading never throws into the loop
 * (and a flaky grader can't drive endless reformulation).
 *
 * @stable
 */
export function createProviderRetrievalGrader(
  provider: Provider,
  options: { readonly maxTokens?: number } = {},
): RetrievalGrader {
  const maxTokens = options.maxTokens ?? DEFAULT_GRADE_MAX_TOKENS;
  return {
    async grade(query, snippets, opts = {}): Promise<RetrievalGrade> {
      try {
        const request = buildGradeRequest(query, snippets, {
          maxTokens,
          ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
        });
        const response = await provider.generate(request);
        return parseGrade(response.text);
      } catch {
        return { sufficient: true, confidence: 0, reformulation: null };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// The bounded loop (pure orchestration over injected retrieve + grader)
// ---------------------------------------------------------------------------

/**
 * Result of an iterative retrieval run.
 *
 * @stable
 */
export interface IterativeRetrievalResult<H> {
  /** Accumulated hits across all passes (deduped, in discovery order). */
  readonly hits: ReadonlyArray<H>;
  /** Number of retrieval passes performed (≥ 1). */
  readonly iterations: number;
  /** Difficulty-gate verdict (whether the loop was eligible to run). */
  readonly gateHard: boolean;
  /** Final sufficiency verdict. */
  readonly sufficient: boolean;
  /**
   * `true` when the loop exhausted its cap / ran out of reformulations
   * while still judged insufficient — the caller should abstain rather
   * than answer from `hits`.
   */
  readonly abstained: boolean;
  /** The sequence of queries tried (original first). */
  readonly queries: ReadonlyArray<string>;
}

/**
 * Dependencies injected into {@link runIterativeRetrieval}. The loop does
 * no I/O of its own — `retrieve` and `grader` own all side effects.
 *
 * @stable
 */
export interface IterativeRetrievalDeps<H> {
  /**
   * Run one retrieval pass for `query`. `widen` is `true` on
   * reformulation passes so the caller can broaden recall (e.g. enable
   * P2-1 one-hop graph expansion).
   */
  retrieve(query: string, widen: boolean, signal?: AbortSignal): Promise<ReadonlyArray<H>>;
  /** Snippet shown to the grader for a hit. */
  snippetOf(hit: H): string;
  /** Stable id used to dedup hits across passes. */
  idOf(hit: H): string;
  /** Grader; `null` ⇒ single-shot (no grading, no provider call). */
  grader: RetrievalGrader | null;
}

/**
 * Options for {@link runIterativeRetrieval}.
 *
 * @stable
 */
export interface IterativeRetrievalOptions {
  /** Total-pass cap; clamped to `[1, {@link MAX_ITERATIONS_CEILING}]`. */
  readonly maxIterations?: number;
  /** Difficulty-gate tuning. */
  readonly difficulty?: DifficultyGateOptions;
  /** Skip the heuristic gate and force the loop (still capped). */
  readonly forceHard?: boolean;
  /** Max snippets passed to the grader per pass. Default 8. */
  readonly maxGradeSnippets?: number;
  /** Cap on the returned hit count (omitted ⇒ all accumulated). */
  readonly maxResults?: number;
  readonly signal?: AbortSignal;
}

/**
 * Run the gated grade-then-reformulate loop.
 *
 * Flow: assess difficulty → retrieve (pass 1) → if not hard *or* no
 * grader, return single-shot → else grade; if sufficient, return; if
 * weak and a reformulation is offered and the cap is not hit, retrieve
 * again (widened) and re-grade; otherwise **abstain**.
 *
 * @stable
 */
export async function runIterativeRetrieval<H>(
  query: string,
  deps: IterativeRetrievalDeps<H>,
  options: IterativeRetrievalOptions = {},
): Promise<IterativeRetrievalResult<H>> {
  const gate =
    options.forceHard === true
      ? { hard: true, score: 1, signals: ['forced'] as ReadonlyArray<string> }
      : assessQueryDifficulty(query, options.difficulty ?? {});
  const cap = clampIterations(options.maxIterations);
  const maxSnippets = Math.max(1, options.maxGradeSnippets ?? DEFAULT_MAX_GRADE_SNIPPETS);
  const signal = options.signal;

  const seen = new Set<string>();
  const accumulated: H[] = [];
  const accumulate = (hits: ReadonlyArray<H>): void => {
    for (const hit of hits) {
      const id = deps.idOf(hit);
      if (seen.has(id)) continue;
      seen.add(id);
      accumulated.push(hit);
    }
  };
  const queries: string[] = [query];
  const tried = new Set<string>([query.trim().toLowerCase()]);

  // Pass 1 — always single-shot, no widening.
  accumulate(await deps.retrieve(query, false, signal));

  // Gate: the loop is eligible only when the query is judged hard *and* a
  // grader exists. Otherwise stay single-shot — we did not grade, so we
  // make no abstention claim.
  const grader = deps.grader;
  if (!gate.hard || grader === null) {
    return finalize(accumulated, 1, gate.hard, true, false, queries, options.maxResults);
  }

  let passes = 1;
  let current = query;
  for (;;) {
    const grade = await grader.grade(
      current,
      accumulated.slice(0, maxSnippets).map(deps.snippetOf),
      signal !== undefined ? { signal } : {},
    );
    if (grade.sufficient) {
      return finalize(accumulated, passes, true, true, false, queries, options.maxResults);
    }
    if (passes >= cap) break;
    const next = normalizeReformulation(grade.reformulation, tried);
    if (next === null) break;
    passes += 1;
    queries.push(next);
    tried.add(next.toLowerCase());
    accumulate(await deps.retrieve(next, true, signal));
    current = next;
  }
  // Cap reached or no further reformulation while still insufficient ⇒ abstain.
  return finalize(accumulated, passes, true, false, true, queries, options.maxResults);
}

function finalize<H>(
  hits: ReadonlyArray<H>,
  iterations: number,
  gateHard: boolean,
  sufficient: boolean,
  abstained: boolean,
  queries: ReadonlyArray<string>,
  maxResults: number | undefined,
): IterativeRetrievalResult<H> {
  const capped =
    maxResults !== undefined && maxResults >= 0 ? hits.slice(0, maxResults) : hits.slice();
  return { hits: capped, iterations, gateHard, sufficient, abstained, queries: [...queries] };
}

function clampIterations(value: number | undefined): number {
  const n = value ?? DEFAULT_MAX_ITERATIONS;
  if (!Number.isFinite(n)) return DEFAULT_MAX_ITERATIONS;
  return Math.min(MAX_ITERATIONS_CEILING, Math.max(1, Math.floor(n)));
}

/**
 * Normalise a proposed reformulation: trim, drop empties, and reject a
 * query already tried (case-insensitive) so the loop never re-treads and
 * cannot spin.
 */
function normalizeReformulation(raw: string | null, tried: ReadonlySet<string>): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (tried.has(trimmed.toLowerCase())) return null;
  return trimmed;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/u).length;
}

function countCommas(text: string): number {
  return (text.match(/,/gu) ?? []).length;
}

function questionMarkCount(text: string): number {
  return (text.match(/\?/gu) ?? []).length;
}

function coerceBool(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === 'yes' || v === 'sufficient') return true;
    if (v === 'false' || v === 'no' || v === 'insufficient') return false;
  }
  return null;
}

function coerceConfidence(value: unknown, sufficient: boolean): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.min(1, Math.max(0, value));
  }
  return sufficient ? 0.8 : 0.3;
}

function coerceReformulation(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.length > 1024 ? trimmed.slice(0, 1024) : trimmed;
}

function coerceReason(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function tryParseObject(text: string): Record<string, unknown> | null {
  const direct = tryJson(text);
  if (isRecord(direct)) return direct;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const sliced = tryJson(text.slice(start, end + 1));
    if (isRecord(sliced)) return sliced;
  }
  return null;
}

function tryJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function stripFence(text: string): string {
  const match = /^```(?:json)?\s*\n([\s\S]*?)\n```/u.exec(text.trim());
  return match?.[1] ?? text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
