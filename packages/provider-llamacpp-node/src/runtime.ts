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
 * Structural mirror of node-llama-cpp v3's `ChatHistoryItem`.
 * A `'model'` turn carries its text as `response: string[]`.
 *
 * @internal
 */
export type LlamaChatHistoryItem =
  | { readonly type: 'system'; readonly text: string }
  | { readonly type: 'user'; readonly text: string }
  | { readonly type: 'model'; readonly response: ReadonlyArray<string> };

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
  /**
   * Replace the session's chat history (node-llama-cpp v3
   * `setChatHistory`). When present, the adapter feeds multi-turn
   * transcripts as REAL chat history + prompts only the last user turn
   * - instead of serialising the whole conversation into one
   * pseudo-prompt string. Optional: fixtures / custom factories without
   * it keep the legacy render-prompt path.
   */
  setChatHistory?(history: ReadonlyArray<LlamaChatHistoryItem>): void;
  /**
   * Release the per-request context / sequence backing this session.
   * node-llama-cpp contexts hold KV-cache memory (hundreds of MB at
   * large context sizes); the adapter calls this in a `finally` after
   * every stream so long-running agents do not leak until OOM.
   */
  dispose?(): void;
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
   * default session factory. Tests stub it; production loads it
   * from the `node-llama-cpp` peer.
   */
  readonly LlamaChatSession?: LlamaChatSessionCtor;
}

/**
 * Structural slice of the peer's `LlamaChatSession` class used by the
 * default session factory: `prompt(text, { onTextChunk })`
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
  /** node-llama-cpp v3 chat-history setter (optional slice). */
  setChatHistory?(history: ReadonlyArray<LlamaChatHistoryItem>): void;
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
 * real default session factory. Cached per process; the
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
