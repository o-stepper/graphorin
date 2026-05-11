/**
 * Lazy `@huggingface/transformers` text-classification pipeline used to
 * score query / passage pairs. The runner caches the first-loaded
 * pipeline per `(model, dtype, device, revision, cacheDir)` tuple so
 * repeated `rerank(...)` calls inside the same process do not pay the
 * model-load cost twice.
 *
 * Tests inject a stub `pipelineFactory`; the production path lazily
 * imports `@huggingface/transformers` so plain inspection of the
 * package (e.g. for documentation generation) does not pull in the
 * native ONNX runtime.
 *
 * @packageDocumentation
 */

/**
 * Numeric dtype hint. Default `'fp16'` per Phase 16 §
 * `@graphorin/reranker-transformersjs`.
 *
 * @stable
 */
export type RerankerDtype = 'fp32' | 'fp16' | 'q8' | 'q4';

/**
 * Output shape returned by `@huggingface/transformers`'
 * text-classification pipeline. Each pair returns either a single
 * `{ label, score }` object (top-k = 1) or an array of them. We
 * normalise on the array form upstream so the cross-encoder always
 * sees a consistent shape.
 *
 * @internal
 */
export interface ClassifierResult {
  readonly label: string;
  readonly score: number;
}

/** @internal */
export type CrossEncoderPipeline = (
  pairs: ReadonlyArray<{ text: string; text_pair: string }>,
  options?: { topk?: number; signal?: AbortSignal },
) => Promise<ReadonlyArray<ClassifierResult> | ReadonlyArray<ReadonlyArray<ClassifierResult>>>;

/** @internal */
export type CrossEncoderPipelineFactory = (
  task: 'text-classification',
  model: string,
  options: {
    revision?: string;
    cache_dir?: string;
    dtype?: RerankerDtype;
    device?: string;
  },
) => Promise<CrossEncoderPipeline>;

/**
 * Raised when the `@huggingface/transformers` peer is missing or the
 * configured cross-encoder model fails to load.
 *
 * @stable
 */
export class CrossEncoderLoadError extends Error {
  override readonly name = 'CrossEncoderLoadError';
}

/** @internal */
let CACHED_PIPELINE_FACTORY: CrossEncoderPipelineFactory | null = null;

/** @internal */
export async function loadDefaultPipelineFactory(): Promise<CrossEncoderPipelineFactory> {
  if (CACHED_PIPELINE_FACTORY !== null) return CACHED_PIPELINE_FACTORY;
  try {
    const mod = (await import('@huggingface/transformers')) as unknown as {
      pipeline: CrossEncoderPipelineFactory;
    };
    CACHED_PIPELINE_FACTORY = mod.pipeline;
    return CACHED_PIPELINE_FACTORY;
  } catch (err) {
    throw new CrossEncoderLoadError(
      "[graphorin/reranker-transformersjs] required peer '@huggingface/transformers' is not installed.",
      { cause: err },
    );
  }
}

/**
 * Test-only helper. Drops the cached pipeline factory so the next
 * loader call re-imports the peer.
 *
 * @internal
 */
export function _resetPipelineFactoryCacheForTesting(): void {
  CACHED_PIPELINE_FACTORY = null;
}

/**
 * Normalises the raw pipeline output to a flat `score[]` aligned with
 * the input pair order. Cross-encoder classifiers return either a
 * single-best `{label, score}` per pair or an array of `topk` entries
 * — we collapse on the highest-scoring positive label.
 *
 * @internal
 */
export function extractPairScores(
  raw: ReadonlyArray<ClassifierResult> | ReadonlyArray<ReadonlyArray<ClassifierResult>>,
  pairCount: number,
): number[] {
  const out: number[] = new Array(pairCount).fill(0) as number[];
  for (let i = 0; i < pairCount; i++) {
    const cell = raw[i];
    if (cell === undefined) continue;
    if (Array.isArray(cell)) {
      let best = Number.NEGATIVE_INFINITY;
      for (const entry of cell) {
        if (entry === undefined) continue;
        if (entry.score > best) best = entry.score;
      }
      out[i] = Number.isFinite(best) ? best : 0;
    } else {
      const single = cell as ClassifierResult;
      out[i] = single.score;
    }
  }
  return out;
}
