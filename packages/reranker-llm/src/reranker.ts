/**
 * LLM-as-reranker. For each `(query, passage)` pair, asks the
 * configured `Provider` to emit a single integer score in `[0,
 * maxScore]`, parses the response, and sorts the candidates by score.
 *
 * Defaults follow ADR-024 / DEC-120 § LLM reranker:
 *
 *  - `temperature: 0` — deterministic for the same model + prompt.
 *  - `batchSize: 5` — five concurrent provider calls per merged batch.
 *  - `maxScore: 10` — operators can widen for finer granularity.
 *  - English scoring prompt; users translate or replace per locale.
 *
 * @packageDocumentation
 */

import type { MemoryHit, MemoryRecord, Provider, Sensitivity } from '@graphorin/core';
import type { ReRanker, ReRankOptions } from '@graphorin/memory/search';

import { defaultScoringPrompt, type ScoringPromptBuilder } from './scoring-prompt.js';
import { defaultPassageExtractor, type PassageExtractor } from './text-extraction.js';

/** @stable */
export const RERANKER_ID = 'llm-judge' as const;

/**
 * Options accepted by {@link createLlmReranker}.
 *
 * @stable
 */
export interface LlmRerankerOptions<TRecord extends MemoryRecord = MemoryRecord> {
  /** Provider used to score each `(query, passage)` pair. */
  readonly provider: Provider;
  /**
   * Maximum integer the model is allowed to return. Default `10`. Score
   * is normalised to `[0, 1]` by dividing by `maxScore`.
   */
  readonly maxScore?: number;
  /**
   * Concurrent provider calls per batch. Default `5`. Larger values
   * improve throughput at the cost of provider rate-limit pressure.
   */
  readonly batchSize?: number;
  /**
   * Override the scoring prompt builder. Defaults to the English
   * template (`defaultScoringPrompt`); pass a localised version per
   * deployment.
   */
  readonly scoringPrompt?: ScoringPromptBuilder;
  /**
   * Override the passage extractor — replaces the default heuristic
   * that walks `text → summary → value → label → id`.
   */
  readonly passageExtractor?: PassageExtractor<TRecord>;
  /**
   * Optional sampling temperature. Default `0`. Override only for
   * deliberate stochasticity (e.g. exploring a topK > maxScore).
   */
  readonly temperature?: number;
  /**
   * Optional max-tokens hint for the integer-only output. Default
   * `8` — large enough for multi-digit `maxScore` values, small
   * enough to fail-fast if the model drifts into a verbose response.
   */
  readonly maxOutputTokens?: number;
  /**
   * Optional `Sensitivity` floor passed through to the provider's
   * sensitivity filter when present. Default `undefined` (provider
   * decides).
   */
  readonly sensitivityFloor?: Sensitivity;
  /**
   * Default fallback score (in [0, 1]) used when the model's reply
   * cannot be parsed as a non-negative integer. Default `0`.
   */
  readonly fallbackScore?: number;
}

/**
 * Build an LLM-as-reranker. The reranker is stateless past the
 * provider reference — the provider's own session / connection
 * lifecycle owns the network resources.
 *
 * @stable
 */
export function createLlmReranker<TRecord extends MemoryRecord = MemoryRecord>(
  options: LlmRerankerOptions<TRecord>,
): LlmReRanker<TRecord> {
  return new LlmReRanker<TRecord>(options);
}

/**
 * `ReRanker` implementation. Matches the contract from
 * `@graphorin/memory/search`.
 *
 * @stable
 */
export class LlmReRanker<TRecord extends MemoryRecord = MemoryRecord> implements ReRanker {
  readonly id = RERANKER_ID;
  readonly provider: Provider;
  readonly maxScore: number;
  readonly batchSize: number;
  readonly temperature: number;
  readonly maxOutputTokens: number;
  readonly fallbackScore: number;

  readonly #scoringPrompt: ScoringPromptBuilder;
  readonly #passageExtractor: PassageExtractor<TRecord>;
  readonly #sensitivityFloor: Sensitivity | undefined;
  #invocationCount = 0;
  #lastPromptTokens = 0;

  constructor(options: LlmRerankerOptions<TRecord>) {
    this.provider = options.provider;
    this.maxScore = options.maxScore ?? 10;
    if (this.maxScore <= 0 || !Number.isFinite(this.maxScore)) {
      throw new TypeError(
        `[graphorin/reranker-llm] maxScore must be a positive finite number, got ${String(options.maxScore)}.`,
      );
    }
    this.batchSize = options.batchSize ?? 5;
    if (this.batchSize <= 0 || !Number.isInteger(this.batchSize)) {
      throw new TypeError(
        `[graphorin/reranker-llm] batchSize must be a positive integer, got ${String(options.batchSize)}.`,
      );
    }
    this.temperature = options.temperature ?? 0;
    this.maxOutputTokens = options.maxOutputTokens ?? 8;
    this.fallbackScore = options.fallbackScore ?? 0;
    this.#scoringPrompt = options.scoringPrompt ?? defaultScoringPrompt;
    this.#passageExtractor =
      options.passageExtractor ?? ((r: TRecord) => defaultPassageExtractor(r));
    this.#sensitivityFloor = options.sensitivityFloor;
  }

  /**
   * Number of `rerank(...)` invocations since construction. Surfaced
   * for observability + the test suite.
   *
   * @stable
   */
  get invocationCount(): number {
    return this.#invocationCount;
  }

  /**
   * Rough total prompt-tokens spent on the most-recent rerank call.
   * Returned by the provider on each `generate(...)`; we expose the
   * sum so tests can assert the batching shape.
   *
   * @stable
   */
  get lastPromptTokens(): number {
    return this.#lastPromptTokens;
  }

  async rerank<TInputRecord extends MemoryRecord>(
    query: string,
    lists: ReadonlyArray<ReadonlyArray<MemoryHit<TInputRecord>>>,
    options: ReRankOptions = {},
  ): Promise<ReadonlyArray<MemoryHit<TInputRecord>>> {
    if (options.signal?.aborted === true) {
      throw new DOMException('LlmReRanker aborted', 'AbortError');
    }
    this.#invocationCount += 1;
    this.#lastPromptTokens = 0;
    const merged = mergeAndDedupe(lists);
    if (merged.length === 0) return [];
    const passages = merged.map((entry) =>
      this.#passageExtractor(entry.hit.record as unknown as TRecord),
    );
    const rawScores = await this.#scoreInBatches(query, passages, options.signal);
    const fused: MemoryHit<TInputRecord>[] = merged.map((entry, idx) => {
      const raw = rawScores[idx] ?? this.fallbackScore * this.maxScore;
      const normalized = normalizeScore(raw, this.maxScore, this.fallbackScore);
      const baseSignals = entry.hit.signals ?? {};
      const signals: Record<string, number> = {
        ...baseSignals,
        llm_score: raw,
        llm_score_norm: normalized,
      };
      return Object.freeze({
        record: entry.hit.record,
        score: normalized,
        signals: Object.freeze(signals),
      });
    });
    fused.sort((a, b) => b.score - a.score);
    const topK = options.topK ?? 10;
    return fused.slice(0, Math.max(0, topK));
  }

  async #scoreInBatches(
    query: string,
    passages: ReadonlyArray<string>,
    signal: AbortSignal | undefined,
  ): Promise<number[]> {
    const out: number[] = new Array(passages.length).fill(this.fallbackScore * this.maxScore);
    for (let i = 0; i < passages.length; i += this.batchSize) {
      if (signal?.aborted === true) {
        throw new DOMException('LlmReRanker aborted', 'AbortError');
      }
      const slice = passages.slice(i, i + this.batchSize);
      const results = await Promise.all(
        slice.map((passage, j) => this.#scoreOne(query, passage, signal, i + j)),
      );
      for (const { idx, score } of results) {
        out[idx] = score;
      }
    }
    return out;
  }

  async #scoreOne(
    query: string,
    passage: string,
    signal: AbortSignal | undefined,
    idx: number,
  ): Promise<{ idx: number; score: number }> {
    const prompt = this.#scoringPrompt({ query, passage, maxScore: this.maxScore });
    const response = await this.provider.generate({
      systemMessage: prompt.system,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt.user }],
        },
      ],
      temperature: this.temperature,
      maxTokens: this.maxOutputTokens,
      ...(signal !== undefined ? { signal } : {}),
      ...(this.#sensitivityFloor !== undefined
        ? { providerOptions: { reranker_sensitivity_floor: this.#sensitivityFloor } }
        : {}),
    });
    this.#lastPromptTokens += response.usage.promptTokens ?? 0;
    const text = response.text ?? '';
    const parsed = parseIntegerResponse(text);
    if (parsed === null) {
      return { idx, score: this.fallbackScore * this.maxScore };
    }
    return { idx, score: parsed };
  }
}

interface MergedEntry<TRecord extends MemoryRecord> {
  readonly hit: MemoryHit<TRecord>;
  readonly firstSeenOrder: number;
}

/**
 * Merge per-source lists, keeping the highest initial score per record
 * id. Pure function; exported for the unit fixture.
 *
 * @stable
 */
export function mergeAndDedupe<TRecord extends MemoryRecord>(
  lists: ReadonlyArray<ReadonlyArray<MemoryHit<TRecord>>>,
): ReadonlyArray<MergedEntry<TRecord>> {
  const out = new Map<string, MergedEntry<TRecord>>();
  let order = 0;
  for (const list of lists) {
    for (const hit of list) {
      const existing = out.get(hit.record.id);
      if (existing === undefined) {
        out.set(hit.record.id, { hit, firstSeenOrder: order++ });
      } else if (hit.score > existing.hit.score) {
        out.set(hit.record.id, { hit, firstSeenOrder: existing.firstSeenOrder });
      }
    }
  }
  const arr = Array.from(out.values());
  arr.sort((a, b) => a.firstSeenOrder - b.firstSeenOrder);
  return arr;
}

/**
 * Parse the model's reply into a non-negative integer. Accepts:
 *
 *  - `'7'` — bare integer.
 *  - `'7\n'` / `' 7 '` — surrounding whitespace stripped.
 *  - `'Score: 7'` / `'7/10'` — first integer in the string is taken.
 *
 * Returns `null` when no integer can be extracted; the reranker
 * substitutes the fallback score.
 *
 * @stable
 */
export function parseIntegerResponse(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  const direct = /^-?\d+$/.exec(trimmed);
  if (direct !== null) {
    const v = Number.parseInt(direct[0], 10);
    return Number.isFinite(v) && v >= 0 ? v : null;
  }
  const search = /\d+/.exec(trimmed);
  if (search === null) return null;
  const v = Number.parseInt(search[0], 10);
  return Number.isFinite(v) && v >= 0 ? v : null;
}

/**
 * Normalise a raw integer score into `[0, 1]`. Rejects out-of-range
 * inputs by clamping; returns the configured fallback when the input
 * is `null` (parse failed upstream).
 *
 * @stable
 */
export function normalizeScore(
  raw: number | null | undefined,
  maxScore: number,
  fallback: number,
): number {
  if (raw === null || raw === undefined || !Number.isFinite(raw)) return fallback;
  if (raw < 0) return 0;
  if (raw > maxScore) return 1;
  return raw / maxScore;
}
