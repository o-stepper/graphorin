/**
 * @graphorin/embedder-ollama — first-class opt-in alternative embedder
 * for the Graphorin framework. Wraps the local Ollama HTTP API.
 *
 * @packageDocumentation
 */

import { createHash } from 'node:crypto';
import type { EmbedderProvider, EmbedOptions } from '@graphorin/core/contracts';

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.2.0';

/**
 * Default Ollama base URL. Operators that run Ollama on a non-default
 * port pass an explicit `baseUrl`.
 *
 * @stable
 */
export const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434';

/**
 * Default Ollama model. Matches the de-facto choice in the Ollama
 * community for general-purpose multilingual embeddings.
 *
 * @stable
 */
export const DEFAULT_OLLAMA_MODEL = 'nomic-embed-text';

/**
 * Options accepted by {@link createOllamaEmbedder}.
 *
 * @stable
 */
export interface OllamaEmbedderOptions {
  /** Default `'nomic-embed-text'`. */
  readonly model?: string;
  /** Default `'http://127.0.0.1:11434'`. */
  readonly baseUrl?: string;
  /**
   * Optional dimensionality hint. When known up-front, the canonical
   * id is stable from the first `embed()` call instead of being
   * resolved from the response.
   */
  readonly dim?: number;
  /**
   * Override `fetch`. Used by the test suite to inject a mock HTTP
   * fixture. Production callers should leave this unset so the
   * embedder uses the platform's `globalThis.fetch`.
   */
  readonly fetchImpl?: typeof fetch;
  /**
   * If `true`, skip the `POST /api/show` model-digest probe at
   * construction. Used in test fixtures where the digest is
   * pre-populated.
   */
  readonly skipDigestProbe?: boolean;
  /**
   * Optional pre-resolved digest (e.g. from a probe done elsewhere).
   * When set, the embedder uses this value instead of issuing a
   * `POST /api/show` request.
   */
  readonly digest?: string;
  /** Optional API path override (default `'/api/embed'`). */
  readonly embedPath?: string;
  /** Optional API path override (default `'/api/embeddings'`). */
  readonly legacyEmbedPath?: string;
  /** Optional API path override (default `'/api/show'`). */
  readonly showPath?: string;
  /**
   * Per-request hard timeout in milliseconds. Default `30000`. Each
   * HTTP call (`/api/show`, `/api/embed`, legacy `/api/embeddings`) is
   * aborted if the Ollama daemon does not respond in time, so a hung
   * daemon never stalls the caller. A per-call {@link EmbedOptions.signal}
   * is combined with this timeout. Set to `0` to disable.
   */
  readonly timeoutMs?: number;
}

/**
 * Raised when the Ollama HTTP API returns a non-2xx response.
 *
 * @stable
 */
export class OllamaEmbedderError extends Error {
  override readonly name = 'OllamaEmbedderError';
  constructor(
    message: string,
    public readonly statusCode?: number,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}

/** Set of model -> dim hints used to seed the canonical id. */
export const KNOWN_OLLAMA_MODEL_DIMS: ReadonlyMap<string, number> = new Map([
  ['nomic-embed-text', 768],
  ['mxbai-embed-large', 1024],
  ['snowflake-arctic-embed', 1024],
  ['bge-m3', 1024],
]);

/**
 * Build an Ollama-backed embedder. The first `embed()` call issues a
 * `POST /api/show` to capture the model digest; subsequent calls hit
 * the embedding endpoint directly.
 *
 * @stable
 */
export function createOllamaEmbedder(options: OllamaEmbedderOptions = {}): OllamaEmbedder {
  return new OllamaEmbedder(options);
}

/**
 * `EmbedderProvider` implementation that talks to the Ollama HTTP API.
 *
 * @stable
 */
export class OllamaEmbedder implements EmbedderProvider {
  readonly #model: string;
  readonly #baseUrl: string;
  readonly #fetchImpl: typeof fetch;
  readonly #skipDigestProbe: boolean;
  readonly #embedPath: string;
  readonly #legacyEmbedPath: string;
  readonly #showPath: string;
  readonly #timeoutMs: number;
  #digest: string | null;
  #resolvedDim: number | null;
  #initialized = false;
  #initializing: Promise<void> | null = null;

  constructor(options: OllamaEmbedderOptions) {
    this.#model = options.model ?? DEFAULT_OLLAMA_MODEL;
    this.#baseUrl = stripTrailingSlashesLocal(options.baseUrl ?? DEFAULT_OLLAMA_BASE_URL);
    this.#fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.#skipDigestProbe = options.skipDigestProbe ?? false;
    this.#embedPath = options.embedPath ?? '/api/embed';
    this.#legacyEmbedPath = options.legacyEmbedPath ?? '/api/embeddings';
    this.#showPath = options.showPath ?? '/api/show';
    this.#timeoutMs = options.timeoutMs ?? 30_000;
    this.#digest = options.digest ?? null;
    this.#resolvedDim = options.dim ?? KNOWN_OLLAMA_MODEL_DIMS.get(this.#model) ?? null;
  }

  /**
   * Build the `{ signal }` fetch-init fragment, combining the caller's
   * abort signal (if any) with the per-request timeout so a hung Ollama
   * daemon cannot stall the embed call. Returns `{}` when neither
   * applies. Call once per fetch — each call mints a fresh timeout.
   */
  #signalInit(opts: EmbedOptions): { signal?: AbortSignal } {
    const timeoutSignal = this.#timeoutMs > 0 ? AbortSignal.timeout(this.#timeoutMs) : undefined;
    const signal =
      opts.signal !== undefined && timeoutSignal !== undefined
        ? AbortSignal.any([opts.signal, timeoutSignal])
        : (opts.signal ?? timeoutSignal);
    return signal === undefined ? {} : { signal };
  }

  /** The canonical embedder id — `'ollama:<model>@<dim-or-digest>'`. */
  id(): string {
    const dim = this.#resolvedDim ?? KNOWN_OLLAMA_MODEL_DIMS.get(this.#model) ?? 0;
    const digest = this.#digest !== null ? `:${this.#digest.slice(0, 12)}` : '';
    return `ollama:${this.#model}@${dim}${digest}`;
  }

  /** Dim resolved at first embed (or known-default fallback). */
  dim(): number {
    if (this.#resolvedDim !== null) return this.#resolvedDim;
    return KNOWN_OLLAMA_MODEL_DIMS.get(this.#model) ?? 0;
  }

  /**
   * Deterministic hash over the embedder's full configuration —
   * including the discovered digest. A model upgrade in the same
   * Ollama instance changes the digest (and therefore the hash), so
   * `lock-on-first` correctly fires a migration path instead of
   * silently reusing the same `embedder_id`.
   */
  configHash(): string {
    return canonicalConfigHash({
      adapter: 'ollama',
      model: this.#model,
      baseUrl: this.#baseUrl,
      digest: this.#digest ?? null,
      dim: this.#resolvedDim ?? null,
    });
  }

  async embed(
    texts: ReadonlyArray<string>,
    opts: EmbedOptions = {},
  ): Promise<ReadonlyArray<Float32Array>> {
    if (texts.length === 0) return [];
    await this.#ensureInitialized(opts);
    return this.#callEmbed(texts, opts);
  }

  async #ensureInitialized(opts: EmbedOptions): Promise<void> {
    if (this.#initialized) return;
    if (this.#initializing !== null) return this.#initializing;
    const inflight = (async () => {
      try {
        if (!this.#skipDigestProbe && this.#digest === null) {
          await this.#probeDigest(opts);
        }
        this.#initialized = true;
      } finally {
        // Always clear the in-flight slot so a transient failure does
        // not poison every subsequent call with the same rejection.
        this.#initializing = null;
      }
    })();
    this.#initializing = inflight;
    return inflight;
  }

  async #probeDigest(opts: EmbedOptions): Promise<void> {
    const url = `${this.#baseUrl}${this.#showPath}`;
    let resp: Response;
    try {
      resp = await this.#fetchImpl(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: this.#model }),
        ...this.#signalInit(opts),
      });
    } catch (err) {
      throw new OllamaEmbedderError(
        `[graphorin/embedder-ollama] failed to reach Ollama at ${url}`,
        undefined,
        { cause: err },
      );
    }
    if (!resp.ok) {
      throw new OllamaEmbedderError(
        `[graphorin/embedder-ollama] /api/show returned ${resp.status} for model '${this.#model}'`,
        resp.status,
      );
    }
    const json = (await resp.json()) as { digest?: string };
    if (typeof json.digest === 'string' && json.digest.length > 0) {
      this.#digest = json.digest;
    }
  }

  async #callEmbed(
    texts: ReadonlyArray<string>,
    opts: EmbedOptions,
  ): Promise<ReadonlyArray<Float32Array>> {
    const batchUrl = `${this.#baseUrl}${this.#embedPath}`;
    const batchBody = JSON.stringify({ model: this.#model, input: [...texts] });
    let resp: Response;
    try {
      resp = await this.#fetchImpl(batchUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: batchBody,
        ...this.#signalInit(opts),
      });
    } catch (err) {
      throw new OllamaEmbedderError(
        `[graphorin/embedder-ollama] failed to reach Ollama at ${batchUrl}`,
        undefined,
        { cause: err },
      );
    }
    if (resp.status === 404) {
      // Older Ollama versions only expose the legacy single-input path.
      return this.#legacyEmbedPerText(texts, opts);
    }
    if (!resp.ok) {
      throw new OllamaEmbedderError(
        `[graphorin/embedder-ollama] /api/embed returned ${resp.status}`,
        resp.status,
      );
    }
    const json = (await resp.json()) as { embeddings?: number[][] };
    const list = json.embeddings;
    if (!Array.isArray(list) || list.length !== texts.length) {
      throw new OllamaEmbedderError(
        `[graphorin/embedder-ollama] /api/embed response had unexpected shape`,
      );
    }
    const out: Float32Array[] = [];
    for (let i = 0; i < list.length; i++) {
      const row = list[i];
      if (!Array.isArray(row)) {
        throw new OllamaEmbedderError(
          `[graphorin/embedder-ollama] embedding row ${i} is not an array`,
        );
      }
      const f32 = Float32Array.from(row);
      if (this.#resolvedDim === null) {
        this.#resolvedDim = f32.length;
      } else if (this.#resolvedDim !== f32.length) {
        throw new OllamaEmbedderError(
          `[graphorin/embedder-ollama] embedding dim drifted: expected ${this.#resolvedDim}, got ${f32.length}`,
        );
      }
      out.push(f32);
    }
    return out;
  }

  async #legacyEmbedPerText(
    texts: ReadonlyArray<string>,
    opts: EmbedOptions,
  ): Promise<ReadonlyArray<Float32Array>> {
    const url = `${this.#baseUrl}${this.#legacyEmbedPath}`;
    const out: Float32Array[] = [];
    for (const text of texts) {
      const resp = await this.#fetchImpl(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: this.#model, prompt: text }),
        ...this.#signalInit(opts),
      });
      if (!resp.ok) {
        throw new OllamaEmbedderError(
          `[graphorin/embedder-ollama] /api/embeddings returned ${resp.status}`,
          resp.status,
        );
      }
      const json = (await resp.json()) as { embedding?: number[] };
      if (!Array.isArray(json.embedding)) {
        throw new OllamaEmbedderError(
          `[graphorin/embedder-ollama] /api/embeddings response has no 'embedding' array`,
        );
      }
      const f32 = Float32Array.from(json.embedding);
      if (this.#resolvedDim === null) this.#resolvedDim = f32.length;
      out.push(f32);
    }
    return out;
  }
}

/**
 * Canonical-JSON deterministic hash over an embedder configuration.
 * Object keys are sorted lexicographically so the resulting hash is
 * stable across `JSON.stringify` reorderings.
 *
 * @stable
 */
export function canonicalConfigHash(config: unknown): string {
  return createHash('sha256').update(canonicalize(config), 'utf8').digest('hex');
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

/**
 * Strip every trailing `/` from a URL string in `O(n)`. Kept regex-free
 * so CodeQL does not flag the (otherwise harmless) `/+` anchored
 * quantifier as a polynomial-redos vector.
 */
function stripTrailingSlashesLocal(url: string): string {
  let end = url.length;
  while (end > 0 && url.charCodeAt(end - 1) === 0x2f) end -= 1;
  return end === url.length ? url : url.slice(0, end);
}
