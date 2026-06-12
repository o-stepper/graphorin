/**
 * Loose structural shapes covering the slice of `node-llama-cpp` we
 * use. Re-declared here to avoid pulling the heavy native peer at
 * type-check time.
 *
 * @internal
 */

/**
 * `Llama` engine instance (returned by `getLlama()`).
 *
 * @internal
 */
export interface LlamaInstance {
  loadModel(args: { modelPath: string; gpuLayers?: number | 'auto' }): Promise<LlamaModelInstance>;
}

/**
 * Loaded GGUF model.
 *
 * @internal
 */
export interface LlamaModelInstance {
  readonly trainContextSize?: number;
  tokenize(text: string): readonly number[] | Uint32Array | Uint8Array;
  createContext(args?: { contextSize?: number }): Promise<{
    getSequence(): { dispose?: () => void };
    dispose?: () => void;
  }>;
  dispose?(): Promise<void>;
}

/**
 * Loaded chat session capable of streaming responses.
 *
 * @internal
 */
export interface LlamaSessionInstance {
  promptStreamingResponse(
    prompt: string,
    options?: {
      readonly signal?: AbortSignal;
      readonly maxTokens?: number;
      readonly temperature?: number;
    },
  ): AsyncIterable<string>;
}

/**
 * Test-only shape for injecting fixture-driven runtime behaviour.
 *
 * @stable
 */
export interface LlamaCppNodeRuntimeOverrides {
  /** Returns a `LlamaInstance` (the result of `getLlama()`). */
  readonly getLlama?: () => Promise<LlamaInstance>;
  /**
   * Build a streaming chat session against an already-loaded model
   * instance. Used by the adapter to wire `model.tokenize` and
   * `session.promptStreamingResponse` to the per-test fixture.
   */
  readonly createSession?: (
    model: LlamaModelInstance,
    system?: string,
  ) => Promise<LlamaSessionInstance>;
  /**
   * Override the `LlamaChatSession` constructor used by the REAL
   * default session factory (PS-3). Tests stub it; production loads it
   * from the `node-llama-cpp` peer.
   */
  readonly LlamaChatSession?: LlamaChatSessionCtor;
}

/**
 * Structural slice of the peer's `LlamaChatSession` class used by the
 * default session factory (PS-3): `prompt(text, { onTextChunk })`
 * resolves with the full response while streaming chunks through the
 * callback.
 *
 * @internal
 */
export interface LlamaChatSessionPeer {
  prompt(
    text: string,
    options?: {
      readonly signal?: AbortSignal;
      readonly maxTokens?: number;
      readonly temperature?: number;
      readonly onTextChunk?: (chunk: string) => void;
    },
  ): Promise<string>;
}

/** @internal */
export type LlamaChatSessionCtor = new (args: {
  readonly contextSequence: unknown;
  readonly systemPrompt?: string;
}) => LlamaChatSessionPeer;

let cachedLlama: LlamaInstance | null = null;
let cachedChatSessionCtor: LlamaChatSessionCtor | null = null;

/**
 * Lazily load the `node-llama-cpp` peer and return the `Llama` engine
 * instance. Cached per process.
 *
 * @internal
 */
export async function loadLlamaModule(
  overrides: LlamaCppNodeRuntimeOverrides | undefined,
): Promise<LlamaInstance> {
  if (overrides?.getLlama !== undefined) return overrides.getLlama();
  if (cachedLlama !== null) return cachedLlama;
  let mod: { getLlama?: unknown };
  try {
    mod = (await import('node-llama-cpp')) as { getLlama?: unknown };
  } catch (cause) {
    throw new Error(
      "[graphorin/provider-llamacpp-node] missing peer dependency 'node-llama-cpp'. " +
        'Install it with `pnpm add node-llama-cpp`.',
      { cause },
    );
  }
  if (typeof mod.getLlama !== 'function') {
    throw new Error(
      '[graphorin/provider-llamacpp-node] installed node-llama-cpp does not expose getLlama().',
    );
  }
  const instance = (await (mod.getLlama as () => Promise<LlamaInstance>)()) as LlamaInstance;
  cachedLlama = instance;
  return instance;
}

/**
 * Lazily resolve the peer's `LlamaChatSession` constructor for the
 * real default session factory (PS-3). Cached per process; the
 * override wins for tests.
 *
 * @internal
 */
export async function loadLlamaChatSessionCtor(
  overrides: LlamaCppNodeRuntimeOverrides | undefined,
): Promise<LlamaChatSessionCtor> {
  if (overrides?.LlamaChatSession !== undefined) return overrides.LlamaChatSession;
  if (cachedChatSessionCtor !== null) return cachedChatSessionCtor;
  let mod: { LlamaChatSession?: unknown };
  try {
    mod = (await import('node-llama-cpp')) as { LlamaChatSession?: unknown };
  } catch (cause) {
    throw new Error(
      "[graphorin/provider-llamacpp-node] missing peer dependency 'node-llama-cpp'. " +
        'Install it with `pnpm add node-llama-cpp`.',
      { cause },
    );
  }
  if (typeof mod.LlamaChatSession !== 'function') {
    throw new Error(
      '[graphorin/provider-llamacpp-node] installed node-llama-cpp does not expose LlamaChatSession.',
    );
  }
  cachedChatSessionCtor = mod.LlamaChatSession as LlamaChatSessionCtor;
  return cachedChatSessionCtor;
}

/**
 * Test-only hook that resets the cached `getLlama()` result.
 *
 * @internal
 */
export function __resetLlamaCache(): void {
  cachedLlama = null;
  cachedChatSessionCtor = null;
}
