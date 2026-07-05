/**
 * Cross-encoder `ReRanker` implementation backed by
 * `@huggingface/transformers`. Lazy-loaded, optional idle eviction,
 * locale-aware default model.
 *
 * @packageDocumentation
 */

import type { MemoryHit, MemoryRecord } from '@graphorin/core';
import type { ReRanker, ReRankOptions } from '@graphorin/memory/search';

import {
  CrossEncoderLoadError,
  type CrossEncoderPipeline,
  type CrossEncoderPipelineFactory,
  extractPairScores,
  loadDefaultPipelineFactory,
  type RerankerDtype,
} from './cross-encoder.js';
import {
  DEFAULT_ENGLISH_MODEL,
  DEFAULT_MULTILINGUAL_MODEL,
  type LocaleTag,
  pickRerankerModel,
} from './model-selection.js';
import { defaultPassageExtractor, type PassageExtractor } from './text-extraction.js';

/**
 * Options accepted by {@link createCrossEncoderReranker}.
 *
 * @stable
 */
export interface CrossEncoderRerankerOptions<TRecord extends MemoryRecord = MemoryRecord> {
  /** Override the auto-picked model. Default: derived from `locale`. */
  readonly model?: string;
  /** BCP 47 locale tag used to select the default model. Default `'en'`. */
  readonly locale?: LocaleTag;
  /** Default `'fp16'`. */
  readonly dtype?: RerankerDtype;
  /** Optional revision pin (`'main'` if unset). */
  readonly revision?: string;
  /** Optional cache directory. Honours `GRAPHORIN_CACHE_DIR` when unset. */
  readonly cacheDir?: string;
  /** Override device (`'cpu'`, `'webgpu'`, …). Default `'cpu'`. */
  readonly device?: string;
  /**
   * Maximum batch size sent to the cross-encoder per inference call.
   * Default `32`. Larger batches improve throughput at the cost of
   * resident memory.
   */
  readonly batchSize?: number;
  /**
   * Optional idle-eviction timeout in milliseconds. When the reranker
   * does not score a pair within this window, the loaded pipeline is
   * dropped so the OS can reclaim the underlying ONNX session. Default
   * `undefined` (eviction disabled).
   */
  readonly idleEvictionMs?: number;
  /**
   * Optional passage extractor - replaces the default heuristic that
   * walks `text → summary → value → label → id`. Useful when a custom
   * `MemoryRecord` schema attaches the canonical text elsewhere.
   */
  readonly passageExtractor?: PassageExtractor<TRecord>;
  /**
   * Inject a `pipelineFactory`. Used by tests to stub the underlying
   * `@huggingface/transformers` pipeline. Production callers leave
   * this unset so the package lazily loads the peer.
   */
  readonly pipelineFactory?: CrossEncoderPipelineFactory;
  /**
   * Override the wall-clock provider. Used by tests so the
   * idle-eviction timer can be exercised deterministically.
   *
   * @internal
   */
  readonly now?: () => number;
}

/** @stable */
export const RERANKER_ID = 'transformersjs-cross-encoder' as const;

/**
 * Build a cross-encoder reranker. Lazy: the pipeline is constructed on
 * the first `rerank()` call so packaging the reranker pays no
 * model-load cost.
 *
 * @stable
 */
export function createCrossEncoderReranker<TRecord extends MemoryRecord = MemoryRecord>(
  options: CrossEncoderRerankerOptions<TRecord> = {},
): TransformersJsReRanker<TRecord> {
  return new TransformersJsReRanker<TRecord>(options);
}

/**
 * `ReRanker` implementation. Matches the contract from
 * `@graphorin/memory/search`.
 *
 * @stable
 */
export class TransformersJsReRanker<TRecord extends MemoryRecord = MemoryRecord>
  implements ReRanker
{
  readonly id = RERANKER_ID;
  readonly model: string;
  readonly locale: LocaleTag;
  readonly dtype: RerankerDtype;
  readonly batchSize: number;
  readonly idleEvictionMs: number | undefined;

  readonly #revision: string | undefined;
  readonly #cacheDir: string | undefined;
  readonly #device: string | undefined;
  readonly #pipelineFactory: CrossEncoderPipelineFactory | undefined;
  readonly #passageExtractor: PassageExtractor<TRecord>;
  readonly #now: () => number;
  #pipeline: CrossEncoderPipeline | null = null;
  #loading: Promise<CrossEncoderPipeline> | null = null;
  #lastUsedAt: number = 0;
  #idleTimer: ReturnType<typeof setTimeout> | null = null;
  #invocationCount = 0;

  constructor(options: CrossEncoderRerankerOptions<TRecord>) {
    this.locale = options.locale ?? 'en';
    this.model = options.model ?? pickRerankerModel(this.locale);
    this.dtype = options.dtype ?? 'fp16';
    this.batchSize = options.batchSize ?? 32;
    if (!Number.isInteger(this.batchSize) || this.batchSize <= 0) {
      throw new RangeError(
        `[graphorin/reranker-transformersjs] batchSize must be a positive integer; got ${String(
          options.batchSize,
        )}.`,
      );
    }
    this.idleEvictionMs = options.idleEvictionMs;
    this.#revision = options.revision;
    this.#cacheDir = options.cacheDir ?? process.env.GRAPHORIN_CACHE_DIR;
    this.#device = options.device;
    this.#pipelineFactory = options.pipelineFactory;
    this.#passageExtractor =
      options.passageExtractor ?? ((record: TRecord) => defaultPassageExtractor(record));
    this.#now = options.now ?? Date.now;
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
   * Whether the underlying ONNX pipeline is currently loaded in
   * memory. Surfaced for the idle-eviction integration test.
   *
   * @stable
   */
  get pipelineLoaded(): boolean {
    return this.#pipeline !== null;
  }

  /**
   * Drop the loaded pipeline. Equivalent to letting the idle-eviction
   * timer fire. Idempotent.
   *
   * @stable
   */
  unload(): void {
    this.#pipeline = null;
    this.#loading = null;
    if (this.#idleTimer !== null) {
      clearTimeout(this.#idleTimer);
      this.#idleTimer = null;
    }
  }

  async rerank<TInputRecord extends MemoryRecord>(
    query: string,
    lists: ReadonlyArray<ReadonlyArray<MemoryHit<TInputRecord>>>,
    options: ReRankOptions = {},
  ): Promise<ReadonlyArray<MemoryHit<TInputRecord>>> {
    if (options.signal?.aborted === true) {
      throw new DOMException('TransformersJsReRanker aborted', 'AbortError');
    }
    this.#invocationCount += 1;
    const merged = mergeAndDedupe(lists);
    if (merged.length === 0) return [];
    const pipeline = await this.#getPipeline();
    const passages = merged.map((entry) =>
      this.#passageExtractor(entry.hit.record as unknown as TRecord),
    );
    const scores = await this.#scoreInBatches(pipeline, query, passages, options.signal);
    const fused: MemoryHit<TInputRecord>[] = merged.map((entry, idx) => {
      const score = scores[idx] ?? 0;
      const baseSignals = entry.hit.signals ?? {};
      const signals: Record<string, number> = {
        ...baseSignals,
        cross_encoder: score,
      };
      return Object.freeze({
        record: entry.hit.record,
        score,
        signals: Object.freeze(signals),
      });
    });
    fused.sort((a, b) => b.score - a.score);
    const topK = options.topK ?? 10;
    return fused.slice(0, Math.max(0, topK));
  }

  async #scoreInBatches(
    pipeline: CrossEncoderPipeline,
    query: string,
    passages: ReadonlyArray<string>,
    signal: AbortSignal | undefined,
  ): Promise<number[]> {
    const out: number[] = [];
    for (let i = 0; i < passages.length; i += this.batchSize) {
      if (signal?.aborted === true) {
        throw new DOMException('TransformersJsReRanker aborted', 'AbortError');
      }
      const batch = passages.slice(i, i + this.batchSize);
      const pairs = batch.map((text_pair) => ({ text: query, text_pair }));
      const raw = await pipeline(pairs, {
        topk: 1,
        ...(signal !== undefined ? { signal } : {}),
      });
      const scores = extractPairScores(raw, batch.length);
      for (const s of scores) out.push(s);
    }
    return out;
  }

  async #getPipeline(): Promise<CrossEncoderPipeline> {
    this.#lastUsedAt = this.#now();
    this.#scheduleIdleEviction();
    if (this.#pipeline !== null) return this.#pipeline;
    if (this.#loading !== null) return this.#loading;
    const factory = this.#pipelineFactory ?? (await loadDefaultPipelineFactory());
    this.#loading = factory('text-classification', this.model, {
      ...(this.#revision !== undefined ? { revision: this.#revision } : {}),
      ...(this.#cacheDir !== undefined ? { cache_dir: this.#cacheDir } : {}),
      ...(this.dtype !== undefined ? { dtype: this.dtype } : {}),
      ...(this.#device !== undefined ? { device: this.#device } : {}),
    })
      .then((pipe) => {
        this.#pipeline = pipe;
        this.#loading = null;
        return pipe;
      })
      .catch((err) => {
        this.#loading = null;
        throw new CrossEncoderLoadError(
          `[graphorin/reranker-transformersjs] failed to load model '${this.model}'.`,
          { cause: err },
        );
      });
    return this.#loading;
  }

  #scheduleIdleEviction(): void {
    if (this.idleEvictionMs === undefined) return;
    if (this.#idleTimer !== null) {
      clearTimeout(this.#idleTimer);
    }
    this.#idleTimer = setTimeout(() => {
      const elapsed = this.#now() - this.#lastUsedAt;
      if (elapsed >= (this.idleEvictionMs ?? 0)) {
        this.#pipeline = null;
        this.#loading = null;
      }
      this.#idleTimer = null;
    }, this.idleEvictionMs);
    this.#idleTimer.unref?.();
  }
}

interface MergedEntry<TRecord extends MemoryRecord> {
  readonly hit: MemoryHit<TRecord>;
  readonly firstSeenOrder: number;
}

/**
 * Merge the per-source lists into a single deduplicated array,
 * preserving the **highest** initial score per record id and the
 * **first-seen order** for stable tie-breaking. Pure function;
 * exported for the unit test fixture.
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
        out.set(hit.record.id, {
          hit,
          firstSeenOrder: existing.firstSeenOrder,
        });
      }
    }
  }
  const arr = Array.from(out.values());
  arr.sort((a, b) => a.firstSeenOrder - b.firstSeenOrder);
  return arr;
}

export { DEFAULT_ENGLISH_MODEL, DEFAULT_MULTILINGUAL_MODEL };
