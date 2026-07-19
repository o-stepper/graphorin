/**
 * @graphorin/embedder-transformersjs - default in-process embedder.
 *
 * Wraps `@huggingface/transformers@^4.1.0` to produce dense embeddings
 * inside the Graphorin process. Default model
 * `Xenova/multilingual-e5-base` (768-dim, multilingual; DEC-130 /
 * ADR-025).
 *
 * @packageDocumentation
 */

import { createHash } from 'node:crypto';
import type { EmbedderProvider, EmbedOptions } from '@graphorin/core/contracts';

/** Canonical version constant, derived from `package.json` at build time. */
import pkg from '../package.json' with { type: 'json' };

export const VERSION: string = pkg.version;

/**
 * Pooling strategy. Defaults to `'mean'` per the multilingual-e5 model
 * card.
 *
 * @stable
 */
export type Pooling = 'mean' | 'cls' | 'first_token' | 'eos' | 'last_token' | 'none';

/**
 * Configuration accepted by {@link createTransformersJsEmbedder}.
 *
 * @stable
 */
export interface TransformersJsEmbedderOptions {
  /** Default `'Xenova/multilingual-e5-base'` (768-dim). */
  readonly model?: string;
  /** Default `'mean'`. */
  readonly pooling?: Pooling;
  /** Default `true`. */
  readonly normalize?: boolean;
  /** Optional model revision pin (`'main'` if unset). */
  readonly revision?: string;
  /**
   * Optional cache directory. When unset, the embedder honours
   * `process.env.GRAPHORIN_CACHE_DIR`, otherwise falls back to the
   * Hugging Face default (`os.homedir()/.cache/huggingface/hub`).
   */
  readonly cacheDir?: string;
  /**
   * Optional dtype hint (`'fp32' | 'fp16' | 'q8' | 'q4'`). When unset,
   * the runtime picks the model's recommended default.
   */
  readonly dtype?: string;
  /** Override device (`'cpu'`, `'webgpu'`, …). Default `'cpu'`. */
  readonly device?: string;
  /**
   * Override the underlying `pipeline` factory - used by the test
   * suite to inject a stub. Production callers should leave this
   * unset so the package lazily loads `@huggingface/transformers`.
   */
  readonly pipelineFactory?: PipelineFactory;
  /**
   * Optional dimensionality hint. When the caller knows the output
   * dimension up-front, it is included in the canonical id without
   * waiting for the first `embed()` call.
   */
  readonly dim?: number;
  /**
   * Disable the automatic E5 `query:` / `passage:` prefixing. The
   * prefixes are applied by default for E5-family models (the multilingual-e5
   * default and any model whose id carries an `e5` token), because the E5 model
   * card requires them and omitting them measurably degrades retrieval. Set
   * this to `true` only if your inputs are already prefixed or you use a
   * non-standard E5 export. Toggling it changes the canonical `configHash`
   * (and thus the embedder id), which triggers a re-embedding migration.
   */
  readonly disableTaskPrefix?: boolean;
}

/**
 * Tiny structural shape of `@huggingface/transformers`' feature-
 * extraction pipeline used by this package. Declared inline so the
 * embedder does not import the heavy peer at build time.
 *
 * @internal
 */
export type FeatureExtractor = (
  texts: string | readonly string[],
  options?: { pooling?: Pooling; normalize?: boolean; signal?: AbortSignal },
) => Promise<{
  data: Float32Array;
  dims: readonly number[];
  tolist?(): unknown;
}>;

/**
 * Pipeline-factory shape used for dependency injection in tests.
 *
 * @internal
 */
export type PipelineFactory = (
  task: 'feature-extraction',
  model: string,
  opts: { revision?: string; cache_dir?: string; dtype?: string; device?: string },
) => Promise<FeatureExtractor>;

const DEFAULT_MODEL = 'Xenova/multilingual-e5-base';
const DEFAULT_DIM = 768;

/**
 * Raised when the underlying transformer model cannot be loaded
 * (offline / corporate firewall / wrong cache dir).
 *
 * @stable
 */
export class EmbedderModelLoadError extends Error {
  override readonly name = 'EmbedderModelLoadError';
}

/**
 * Build a `TransformersJsEmbedder` instance. Lazy: the underlying
 * pipeline is constructed on the first `embed()` call so packaging
 * the embedder does not pay the model-load cost.
 *
 * @stable
 */
export function createTransformersJsEmbedder(
  options: TransformersJsEmbedderOptions = {},
): TransformersJsEmbedder {
  return new TransformersJsEmbedder(options);
}

/**
 * `EmbedderProvider` implementation backed by `@huggingface/transformers`.
 *
 * @stable
 */
export class TransformersJsEmbedder implements EmbedderProvider {
  readonly #model: string;
  readonly #pooling: Pooling;
  readonly #normalize: boolean;
  readonly #revision: string | undefined;
  readonly #cacheDir: string | undefined;
  readonly #dtype: string | undefined;
  readonly #device: string | undefined;
  readonly #pipelineFactory: PipelineFactory | undefined;
  /** Whether to apply E5 `query:` / `passage:` prefixes. */
  readonly #taskPrefix: boolean;
  #extractor: FeatureExtractor | null = null;
  #loading: Promise<FeatureExtractor> | null = null;
  #resolvedDim: number | null;

  constructor(options: TransformersJsEmbedderOptions) {
    this.#model = options.model ?? DEFAULT_MODEL;
    this.#pooling = options.pooling ?? 'mean';
    this.#normalize = options.normalize ?? true;
    this.#revision = options.revision;
    this.#cacheDir = options.cacheDir ?? process.env.GRAPHORIN_CACHE_DIR;
    this.#dtype = options.dtype;
    this.#device = options.device;
    this.#pipelineFactory = options.pipelineFactory;
    this.#resolvedDim = options.dim ?? guessDefaultDim(this.#model);
    this.#taskPrefix = isE5Model(this.#model) && options.disableTaskPrefix !== true;
  }

  id(): string {
    return `transformersjs:${this.#model}@${this.dim()}`;
  }

  /**
   * Output dimension - the explicit `dim` option, a known-model
   * default, or the width resolved from the first `embed()`. Like the
   * Ollama embedder, this throws for an unknown model with no `dim`
   * hint instead of silently assuming 768 - a wrong assumed width
   * bakes a wrong-width id AND a wrong-width vec0 table, and the id
   * then CHANGES after the first `embed()` resolves the truth, which
   * `lock-on-first` reads as an embedder swap.
   */
  dim(): number {
    if (this.#resolvedDim !== null) return this.#resolvedDim;
    throw new Error(
      `[graphorin/embedder-transformersjs] Unknown embedding width for model '${this.#model}'. ` +
        `Pass { dim: <width> } to createTransformersJsEmbedder(...) (or call embed() once before ` +
        `registration so the width is resolved from the model output).`,
    );
  }

  configHash(): string {
    return canonicalConfigHash({
      adapter: 'transformersjs',
      model: this.#model,
      pooling: this.#pooling,
      normalize: this.#normalize,
      revision: this.#revision ?? null,
      dtype: this.#dtype ?? null,
      device: this.#device ?? null,
      // PS-10: the prefix policy changes the embeddings, so it must change the
      // id. Only added when active (E5 + not disabled) so non-E5 ids - and the
      // historical hash of an E5 model with prefixing turned off - are stable.
      ...(this.#taskPrefix ? { taskPrefix: 'e5' as const } : {}),
    });
  }

  async embed(
    texts: ReadonlyArray<string>,
    opts: EmbedOptions = {},
  ): Promise<ReadonlyArray<Float32Array>> {
    if (texts.length === 0) return [];
    const extractor = await this.#getExtractor();
    // PS-10: E5 models require an asymmetric `query:` / `passage:` prefix.
    // Default to `passage` (the indexing role) when the caller doesn't specify.
    const inputs = this.#taskPrefix
      ? texts.map((t) => `${opts.taskType ?? 'passage'}: ${t}`)
      : [...texts];
    const result = await extractor(inputs, {
      pooling: this.#pooling,
      normalize: this.#normalize,
      ...(opts.signal !== undefined ? { signal: opts.signal } : {}),
    });
    const lastDim = result.dims[result.dims.length - 1] ?? this.#resolvedDim ?? DEFAULT_DIM;
    // periphery-05: a width already published (via `dim` option or a
    // prior embed) must not silently drift - the vec0 table and the
    // canonical id were derived from it.
    if (this.#resolvedDim !== null && lastDim !== this.#resolvedDim) {
      throw new Error(
        `[graphorin/embedder-transformersjs] Model '${this.#model}' produced ${lastDim}-dim ` +
          `vectors but the embedder is bound to ${this.#resolvedDim} - check the 'dim' option.`,
      );
    }
    if (this.#resolvedDim === null) {
      this.#resolvedDim = lastDim;
    }
    const dim = lastDim;
    const out: Float32Array[] = [];
    for (let i = 0; i < texts.length; i++) {
      const start = i * dim;
      out.push(result.data.slice(start, start + dim));
    }
    return out;
  }

  async #getExtractor(): Promise<FeatureExtractor> {
    if (this.#extractor !== null) return this.#extractor;
    if (this.#loading !== null) return this.#loading;
    const loader = this.#pipelineFactory ?? (await loadDefaultPipelineFactory());
    this.#loading = loader('feature-extraction', this.#model, {
      ...(this.#revision !== undefined ? { revision: this.#revision } : {}),
      ...(this.#cacheDir !== undefined ? { cache_dir: this.#cacheDir } : {}),
      ...(this.#dtype !== undefined ? { dtype: this.#dtype } : {}),
      ...(this.#device !== undefined ? { device: this.#device } : {}),
    })
      .then((pipe) => {
        this.#extractor = pipe;
        this.#loading = null;
        return pipe;
      })
      .catch((err) => {
        this.#loading = null;
        throw new EmbedderModelLoadError(
          `[graphorin/embedder-transformersjs] failed to load model '${this.#model}'. ` +
            'See the offline-install guide for instructions on pre-downloading the model.',
          { cause: err },
        );
      });
    return this.#loading;
  }
}

/** @internal */
let CACHED_PIPELINE_FACTORY: PipelineFactory | null = null;

async function loadDefaultPipelineFactory(): Promise<PipelineFactory> {
  if (CACHED_PIPELINE_FACTORY !== null) return CACHED_PIPELINE_FACTORY;
  try {
    const mod = (await import('@huggingface/transformers')) as unknown as {
      pipeline: PipelineFactory;
    };
    CACHED_PIPELINE_FACTORY = mod.pipeline;
    return CACHED_PIPELINE_FACTORY;
  } catch (err) {
    throw new EmbedderModelLoadError(
      "[graphorin/embedder-transformersjs] required peer '@huggingface/transformers' is not installed.",
      { cause: err },
    );
  }
}

/** Test-only cache reset. */
export function _resetPipelineFactoryCacheForTesting(): void {
  CACHED_PIPELINE_FACTORY = null;
}

const KNOWN_DIMS: ReadonlyMap<string, number> = new Map([
  ['Xenova/multilingual-e5-small', 384],
  ['Xenova/multilingual-e5-base', 768],
  ['Xenova/multilingual-e5-large', 1024],
  ['Xenova/bge-m3', 1024],
  ['onnx-community/all-MiniLM-L6-v2-ONNX', 384],
]);

function guessDefaultDim(model: string): number | null {
  return KNOWN_DIMS.get(model) ?? null;
}

/**
 * True when a model id belongs to the E5 family, which requires asymmetric
 * `query:` / `passage:` prefixes. Matches an `e5` token bounded by a
 * path / dash / underscore so it covers `multilingual-e5-base`, `e5-large`,
 * `intfloat/e5-mistral`, etc. without false-matching unrelated names.
 */
export function isE5Model(model: string): boolean {
  return /(?:^|[/_-])e5(?:[/_-]|$)/i.test(model);
}

/**
 * Canonical-JSON deterministic hash of an embedder configuration.
 * Object keys are sorted lexicographically; primitives flow through as
 * `JSON.stringify` would render them. Used by the multi-table per-
 * embedder vec0 layout to tell drift apart from a true model swap.
 *
 * @stable
 */
export function canonicalConfigHash(config: unknown): string {
  const canonical = canonicalize(config);
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

function canonicalize(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return Number.isFinite(value) ? value.toString() : 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(canonicalize).join(',')}]`;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
  }
  return 'null';
}
