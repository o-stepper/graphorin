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
}

let cachedLlama: LlamaInstance | null = null;

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
 * Test-only hook that resets the cached `getLlama()` result.
 *
 * @internal
 */
export function __resetLlamaCache(): void {
  cachedLlama = null;
}
