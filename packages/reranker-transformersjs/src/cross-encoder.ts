/**
 * Lazy `@huggingface/transformers` scorer used to rate query / passage
 * pairs. The default production path runs the raw
 * `AutoModelForSequenceClassification` + `AutoTokenizer` and converts
 * logits to relevance scores itself: the library's text-classification
 * pipeline softmaxes each row, which collapses the single logit of the
 * default bge rerankers to a constant `1.0` for every pair (N-01/23).
 * Injected `pipelineFactory` stubs (tests) keep the classifier-pipeline
 * contract unchanged.
 *
 * The loaded scorer is cached per reranker instance; the production
 * path lazily imports `@huggingface/transformers` so plain inspection
 * of the package (e.g. for documentation generation) does not pull in
 * the native ONNX runtime.
 *
 * @packageDocumentation
 */

/**
 * Numeric dtype hint. Default: `'q8'` on the CPU device, `'fp16'` on
 * accelerated devices - see {@link defaultRerankerDtype}.
 *
 * @stable
 */
export type RerankerDtype = 'fp32' | 'fp16' | 'q8' | 'q4';

/**
 * Device-aware default precision. The fp16 ONNX exports of the default
 * BGE rerankers fail session initialisation on the onnxruntime-node CPU
 * execution provider (`SimplifiedLayerNormFusion` cast error, N-01/22),
 * so the CPU default is the q8 quantization; non-CPU devices
 * (`'webgpu'`, ...) keep fp16.
 *
 * @stable
 */
export function defaultRerankerDtype(device: string | undefined): RerankerDtype {
  return device === undefined || device === 'cpu' ? 'q8' : 'fp16';
}

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
export interface CrossEncoderLoadOptions {
  revision?: string;
  cache_dir?: string;
  dtype?: RerankerDtype;
  device?: string;
}

/** @internal */
export type CrossEncoderPipelineFactory = (
  task: 'text-classification',
  model: string,
  options: CrossEncoderLoadOptions,
) => Promise<CrossEncoderPipeline>;

/**
 * Loaded scorer: rates each `(query, passage)` pair with a relevance
 * score in `[0, 1]`, aligned with the input pair order.
 *
 * @internal
 */
export type PairScorer = (
  pairs: ReadonlyArray<{ text: string; text_pair: string }>,
  signal?: AbortSignal,
) => Promise<number[]>;

/**
 * Raised when the `@huggingface/transformers` peer is missing or the
 * configured cross-encoder model fails to load.
 *
 * @stable
 */
export class CrossEncoderLoadError extends Error {
  override readonly name = 'CrossEncoderLoadError';
}

/**
 * Minimal structural view of the `@huggingface/transformers` surface
 * the raw scorer path consumes. The tokenizer instance is callable and
 * accepts batched `text` / `text_pair` arrays exactly like the
 * text-classification pipeline does internally; the model instance is
 * callable and yields a `[batch, numLabels]` logits tensor.
 *
 * @internal
 */
interface TransformersModule {
  pipeline: CrossEncoderPipelineFactory;
  AutoTokenizer: {
    from_pretrained(model: string, options?: Record<string, unknown>): Promise<RawTokenizer>;
  };
  AutoModelForSequenceClassification: {
    from_pretrained(
      model: string,
      options?: Record<string, unknown>,
    ): Promise<RawSequenceClassificationModel>;
  };
}

/** @internal */
type RawTokenizer = (
  texts: string[],
  options: { text_pair: string[]; padding: boolean; truncation: boolean },
) => unknown;

/** @internal */
interface RawLogits {
  readonly data: ArrayLike<number>;
  readonly dims: ReadonlyArray<number>;
}

/** @internal */
type RawSequenceClassificationModel = ((inputs: unknown) => Promise<{ logits: RawLogits }>) & {
  readonly config?: { readonly id2label?: Readonly<Record<string, string>> };
};

/** @internal */
let CACHED_TRANSFORMERS_MODULE: TransformersModule | null = null;

/** @internal */
async function importTransformersModule(): Promise<TransformersModule> {
  if (CACHED_TRANSFORMERS_MODULE !== null) return CACHED_TRANSFORMERS_MODULE;
  try {
    const mod = (await import('@huggingface/transformers')) as unknown as TransformersModule;
    CACHED_TRANSFORMERS_MODULE = mod;
    return mod;
  } catch (err) {
    throw new CrossEncoderLoadError(
      "[graphorin/reranker-transformersjs] required peer '@huggingface/transformers' is not installed.",
      { cause: err },
    );
  }
}

/** @internal */
export async function loadDefaultPipelineFactory(): Promise<CrossEncoderPipelineFactory> {
  const mod = await importTransformersModule();
  return mod.pipeline;
}

/**
 * Test-only helper. Drops the cached module so the next loader call
 * re-imports the peer.
 *
 * @internal
 */
export function _resetPipelineFactoryCacheForTesting(): void {
  CACHED_TRANSFORMERS_MODULE = null;
}

/**
 * Wrap an injected text-classification pipeline factory into a
 * {@link PairScorer}. Kept for backward compatibility: unit tests (and
 * any external caller) that inject a `pipelineFactory` keep the exact
 * classifier-pipeline contract, including the `topk: 1` call shape and
 * {@link extractPairScores} normalisation.
 *
 * @internal
 */
export async function buildPipelineScorer(
  factory: CrossEncoderPipelineFactory,
  model: string,
  options: CrossEncoderLoadOptions,
): Promise<PairScorer> {
  const pipe = await factory('text-classification', model, options);
  return async (pairs, signal) => {
    const raw = await pipe(pairs, {
      topk: 1,
      ...(signal !== undefined ? { signal } : {}),
    });
    return extractPairScores(raw, pairs.length);
  };
}

/**
 * Load the default (real) scorer: raw
 * `AutoModelForSequenceClassification` logits converted by
 * {@link scoresFromLogits}. The text-classification pipeline is
 * deliberately bypassed - it softmaxes each logit row, which turns the
 * single-logit output of the default bge rerankers into a constant
 * `1.0` for every pair (N-01/23).
 *
 * @internal
 */
export async function loadRawCrossEncoderScorer(
  model: string,
  options: CrossEncoderLoadOptions,
): Promise<PairScorer> {
  const mod = await importTransformersModule();
  const shared = {
    ...(options.revision !== undefined ? { revision: options.revision } : {}),
    ...(options.cache_dir !== undefined ? { cache_dir: options.cache_dir } : {}),
  };
  const tokenizer = await mod.AutoTokenizer.from_pretrained(model, shared);
  const rawModel = await mod.AutoModelForSequenceClassification.from_pretrained(model, {
    ...shared,
    ...(options.dtype !== undefined ? { dtype: options.dtype } : {}),
    ...(options.device !== undefined ? { device: options.device } : {}),
  });
  const id2label = rawModel.config?.id2label;
  return async (pairs) => {
    if (pairs.length === 0) return [];
    const inputs = tokenizer(
      pairs.map((p) => p.text),
      {
        text_pair: pairs.map((p) => p.text_pair),
        padding: true,
        truncation: true,
      },
    );
    const { logits } = await rawModel(inputs);
    return scoresFromLogits(logits.data, logits.dims, id2label, pairs.length);
  };
}

/**
 * True when a classifier label names the *positive* (relevant) class. Matches
 * the conventional binary forms - `LABEL_1`, `positive`, `relevant`,
 * `entailment`, `true`, `yes` - using exact words so it does not mis-fire on a
 * negative label that merely contains one (`irrelevant` ⊃ `relevant`).
 */
function isPositiveLabel(label: string): boolean {
  const l = label.toLowerCase().trim();
  if (l === '1' || /(?:^|[_-])1$/.test(l)) return true; // '1', 'label_1', 'class-1'
  return /^(?:positive|relevant|entailment|true|yes|pos)$/.test(l);
}

/**
 * Normalises the raw pipeline output to a flat `score[]` aligned with the input
 * pair order. Cross-encoder classifiers return either a single-best
 * `{label, score}` per pair (the default single-logit bge exports) or an array
 * of `topk` entries. For the array shape we read the POSITIVE label's
 * confidence - NOT the max of any label: an irrelevant pair's most
 * confident class is the *negative* one, so taking the max would invert the
 * ranking for any 2-label classifier. When no label looks positive (single-logit
 * or unrecognised labels) we fall back to the top score.
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
      let positive = Number.NEGATIVE_INFINITY;
      let sawPositive = false;
      for (const entry of cell) {
        if (entry === undefined) continue;
        if (entry.score > best) best = entry.score;
        if (isPositiveLabel(entry.label)) {
          sawPositive = true;
          if (entry.score > positive) positive = entry.score;
        }
      }
      const chosen = sawPositive ? positive : best;
      out[i] = Number.isFinite(chosen) ? chosen : 0;
    } else {
      const single = cell as ClassifierResult;
      out[i] = single.score;
    }
  }
  return out;
}

/**
 * Convert a raw `[pairCount, numLabels]` logits tensor into relevance
 * scores aligned with the input pair order:
 *
 *  - single-logit heads (the default bge reranker exports) → sigmoid,
 *    preserving the model's discrimination instead of softmaxing the
 *    lone logit to a constant `1.0`;
 *  - multi-logit heads → softmax over the row, reading the POSITIVE
 *    label's probability via `config.id2label` (falling back to index 1
 *    for unlabeled binary heads per the `LABEL_0`/`LABEL_1` convention,
 *    then to the max probability - parity with
 *    {@link extractPairScores}).
 *
 * @internal
 */
export function scoresFromLogits(
  data: ArrayLike<number>,
  dims: ReadonlyArray<number>,
  id2label: Readonly<Record<string, string>> | undefined,
  pairCount: number,
): number[] {
  const lastDim = dims.length >= 2 ? (dims[dims.length - 1] ?? 1) : 1;
  const numLabels = Math.max(1, lastDim);
  const out: number[] = new Array(pairCount).fill(0) as number[];
  for (let i = 0; i < pairCount; i++) {
    const base = i * numLabels;
    if (base + numLabels > data.length) break;
    if (numLabels === 1) {
      const logit = Number(data[base]);
      out[i] = 1 / (1 + Math.exp(-logit));
      continue;
    }
    let max = Number.NEGATIVE_INFINITY;
    for (let j = 0; j < numLabels; j++) {
      const v = Number(data[base + j]);
      if (v > max) max = v;
    }
    const exps: number[] = new Array(numLabels).fill(0) as number[];
    let sum = 0;
    for (let j = 0; j < numLabels; j++) {
      const e = Math.exp(Number(data[base + j]) - max);
      exps[j] = e;
      sum += e;
    }
    let positiveIndex = -1;
    if (id2label !== undefined) {
      for (let j = 0; j < numLabels; j++) {
        const label = id2label[String(j)];
        if (label !== undefined && isPositiveLabel(label)) {
          positiveIndex = j;
          break;
        }
      }
    }
    if (positiveIndex === -1 && numLabels === 2) positiveIndex = 1;
    if (positiveIndex >= 0) {
      out[i] = (exps[positiveIndex] ?? 0) / sum;
    } else {
      out[i] = Math.max(...exps) / sum;
    }
  }
  return out;
}
