/**
 * `llamaCppNodeAdapter` — in-process GGUF adapter built on
 * `node-llama-cpp@^3.5`. The adapter declares `trust: 'loopback'`
 * permanently because the model lives in the same trust boundary as
 * the host process.
 *
 * @packageDocumentation
 */

import type {
  Provider,
  ProviderCapabilities,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
  Sensitivity,
  Usage,
} from '@graphorin/core';
import { ProviderHttpError } from '@graphorin/provider/errors';
import { applyReasoningPolicy, resolveReasoningRetention } from '@graphorin/provider/reasoning';
import {
  type LlamaChatSessionPeer,
  type LlamaCppNodeRuntimeOverrides,
  type LlamaModelInstance,
  type LlamaSessionInstance,
  loadLlamaChatSessionCtor,
  loadLlamaModule,
} from './runtime.js';

/**
 * Default sensitivity envelope for the in-process adapter — same as
 * the loopback HTTP path.
 *
 * @stable
 */
export const LLAMA_CPP_NODE_ACCEPTS_SENSITIVITY: ReadonlyArray<Sensitivity> = Object.freeze([
  'public',
  'internal',
  'secret',
]);

/**
 * Options accepted by {@link llamaCppNodeAdapter}.
 *
 * @stable
 */
export interface LlamaCppNodeAdapterOptions {
  /** Filesystem path to the `.gguf` model file. */
  readonly modelPath: string;
  /** Number of layers to offload to the GPU. Default `'auto'`. */
  readonly gpuLayers?: number | 'auto';
  /** Optional context-window override. */
  readonly contextSize?: number;
  /** Provider name attached to spans / log lines. */
  readonly name?: string;
  /** Capability declaration. Merged on top of the defaults table. */
  readonly capabilities?: Partial<ProviderCapabilities>;
  /** Sensitivity override (defaults to the loopback envelope). */
  readonly acceptsSensitivity?: ReadonlyArray<Sensitivity>;
  /**
   * Test-only runtime override. When unset the adapter loads
   * `node-llama-cpp` lazily on first call.
   */
  readonly runtimeOverrides?: LlamaCppNodeRuntimeOverrides;
  /**
   * Optional `model` override that short-circuits the
   * `loadLlamaModule(...).loadModel(...)` flow. Tests pass a fixture
   * shaped instance.
   */
  readonly modelOverride?: LlamaModelInstance;
  /**
   * Optional session factory override. When unset, the adapter builds a
   * real session from the peer (PS-3): `model.createContext()` →
   * `new LlamaChatSession({ contextSequence })`, streaming through
   * `prompt(text, { onTextChunk })`. Overrides
   * (`runtimeOverrides.createSession` or this option) keep the test
   * seam.
   */
  readonly sessionFactory?: (
    model: LlamaModelInstance,
    system?: string,
  ) => Promise<LlamaSessionInstance>;
}

const DEFAULT_CAPABILITIES: ProviderCapabilities = {
  streaming: true,
  toolCalling: false,
  parallelToolCalls: false,
  multimodal: false,
  structuredOutput: false,
  reasoning: false,
  contextWindow: 8_192,
  maxOutput: 4_096,
  reasoningContract: 'optional',
};

/**
 * Build a Graphorin {@link Provider} backed by an in-process GGUF
 * model. The first call lazily loads the `node-llama-cpp` peer + the
 * model file; subsequent calls reuse the cached instances.
 *
 * @stable
 */
export function llamaCppNodeAdapter(options: LlamaCppNodeAdapterOptions): Provider {
  const providerName = options.name ?? `llama-cpp-node-${basename(options.modelPath)}`;
  const capabilities: ProviderCapabilities = {
    ...DEFAULT_CAPABILITIES,
    ...options.capabilities,
  };
  const acceptsSensitivity = options.acceptsSensitivity ?? LLAMA_CPP_NODE_ACCEPTS_SENSITIVITY;
  let resolved: { model: LlamaModelInstance } | null = null;
  let resolving: Promise<{ model: LlamaModelInstance }> | null = null;
  const ensureModel = async (): Promise<{ model: LlamaModelInstance }> => {
    if (resolved !== null) return resolved;
    if (resolving !== null) return resolving;
    resolving = (async () => {
      const model = options.modelOverride ?? (await resolveModel(options));
      resolved = { model };
      resolving = null;
      return resolved;
    })();
    return resolving;
  };
  const sessionFactory =
    options.sessionFactory ??
    options.runtimeOverrides?.createSession ??
    ((model: LlamaModelInstance, system?: string) => defaultSessionFactory(model, system, options));
  return {
    name: providerName,
    modelId: options.modelPath,
    capabilities,
    acceptsSensitivity,
    stream(req) {
      return streamLlamaCppNode(
        ensureModel,
        sessionFactory,
        providerName,
        options,
        applyLlamaCppNodePreflight(req, capabilities),
      );
    },
    async generate(req) {
      const events = streamLlamaCppNode(
        ensureModel,
        sessionFactory,
        providerName,
        options,
        applyLlamaCppNodePreflight(req, capabilities),
      );
      const collected: string[] = [];
      let usage: Usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      let finishReason: ProviderResponse['finishReason'] = 'stop';
      let streamError: { message: string } | undefined;
      for await (const event of events) {
        if (event.type === 'text-delta') collected.push(event.delta);
        if (event.type === 'error') streamError = event.error;
        if (event.type === 'finish') {
          usage = event.usage;
          finishReason = event.finishReason;
        }
      }
      // PS-4: a swallowed mid-stream error returned truncated text
      // indistinguishable from success — and a never-throwing
      // generate() bypasses withRetry / withFallback entirely.
      if (streamError !== undefined) {
        throw new ProviderHttpError({
          providerName,
          status: 0,
          message: streamError.message,
        });
      }
      return {
        text: collected.join(''),
        usage,
        finishReason,
      };
    },
  };
}

function applyLlamaCppNodePreflight(
  req: ProviderRequest,
  capabilities: ProviderCapabilities,
): ProviderRequest {
  const retention = resolveReasoningRetention({
    ...(req.reasoningRetention !== undefined ? { requested: req.reasoningRetention } : {}),
    ...(capabilities.reasoningContract !== undefined
      ? { contract: capabilities.reasoningContract }
      : {}),
  });
  if (retention === 'pass-through-all') return req;
  const filtered = applyReasoningPolicy({ messages: req.messages, retention });
  if (filtered === req.messages) return req;
  return { ...req, messages: filtered };
}

async function* streamLlamaCppNode(
  ensureModel: () => Promise<{ model: LlamaModelInstance }>,
  sessionFactory: (model: LlamaModelInstance, system?: string) => Promise<LlamaSessionInstance>,
  providerName: string,
  options: LlamaCppNodeAdapterOptions,
  req: ProviderRequest,
): AsyncIterable<ProviderEvent> {
  const { model } = await ensureModel();
  const session = await sessionFactory(
    model,
    typeof req.systemMessage === 'string' ? req.systemMessage : undefined,
  );
  const prompt = renderPrompt(req);
  const promptTokens = lengthOf(model.tokenize(prompt));
  yield {
    type: 'stream-start',
    metadata: {
      providerName,
      modelId: options.modelPath,
      createdAt: new Date().toISOString(),
    },
  };
  let completionTokens = 0;
  let errored = false;
  try {
    const streamOptions: { signal?: AbortSignal; maxTokens?: number; temperature?: number } = {};
    if (req.signal !== undefined) streamOptions.signal = req.signal;
    if (req.maxTokens !== undefined) streamOptions.maxTokens = req.maxTokens;
    if (req.temperature !== undefined) streamOptions.temperature = req.temperature;
    for await (const piece of session.promptStreamingResponse(prompt, streamOptions)) {
      if (typeof piece !== 'string' || piece.length === 0) continue;
      completionTokens += lengthOf(model.tokenize(piece));
      yield { type: 'text-delta', delta: piece };
      if (req.signal?.aborted) break;
    }
  } catch (err) {
    errored = true;
    yield { type: 'error', error: { kind: 'unknown', message: (err as Error).message } };
  }
  yield {
    type: 'finish',
    // PS-4: a mid-stream failure must not masquerade as a clean stop —
    // partial text would be indistinguishable from success.
    finishReason: errored ? 'error' : 'stop',
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
  };
}

async function resolveModel(options: LlamaCppNodeAdapterOptions): Promise<LlamaModelInstance> {
  const llama = await loadLlamaModule(options.runtimeOverrides);
  return llama.loadModel({
    modelPath: options.modelPath,
    ...(options.gpuLayers !== undefined ? { gpuLayers: options.gpuLayers } : {}),
  });
}

/**
 * The REAL default session factory (PS-3): `model.createContext()` →
 * `context.getSequence()` → `new LlamaChatSession({ contextSequence })`
 * from the lazily-loaded peer, adapting its callback-streaming
 * `prompt(text, { onTextChunk })` to the adapter's
 * `promptStreamingResponse` AsyncIterable contract.
 */
async function defaultSessionFactory(
  model: LlamaModelInstance,
  system: string | undefined,
  options: LlamaCppNodeAdapterOptions,
): Promise<LlamaSessionInstance> {
  const ChatSession = await loadLlamaChatSessionCtor(options.runtimeOverrides);
  const context = await model.createContext(
    options.contextSize !== undefined ? { contextSize: options.contextSize } : undefined,
  );
  const sequence = context.getSequence();
  const session = new ChatSession({
    contextSequence: sequence,
    ...(system !== undefined ? { systemPrompt: system } : {}),
  });
  return {
    promptStreamingResponse(prompt, streamOptions) {
      return promptToIterable(session, prompt, streamOptions);
    },
  };
}

/**
 * Bridge the peer's callback-streaming `prompt(...)` into the
 * AsyncIterable the adapter consumes. A rejection from `prompt`
 * rejects the pending/next iteration so the stream's error path
 * (PS-4) observes it.
 */
function promptToIterable(
  session: LlamaChatSessionPeer,
  prompt: string,
  streamOptions?: {
    readonly signal?: AbortSignal;
    readonly maxTokens?: number;
    readonly temperature?: number;
  },
): AsyncIterable<string> {
  const queue: string[] = [];
  let done = false;
  let failure: unknown;
  let wake: (() => void) | null = null;
  const notify = (): void => {
    if (wake !== null) {
      const w = wake;
      wake = null;
      w();
    }
  };
  void session
    .prompt(prompt, {
      ...(streamOptions?.signal !== undefined ? { signal: streamOptions.signal } : {}),
      ...(streamOptions?.maxTokens !== undefined ? { maxTokens: streamOptions.maxTokens } : {}),
      ...(streamOptions?.temperature !== undefined
        ? { temperature: streamOptions.temperature }
        : {}),
      onTextChunk: (chunk: string) => {
        if (typeof chunk === 'string' && chunk.length > 0) queue.push(chunk);
        notify();
      },
    })
    .then(
      () => {
        done = true;
        notify();
      },
      (err: unknown) => {
        failure = err instanceof Error ? err : new Error(String(err));
        done = true;
        notify();
      },
    );
  return {
    [Symbol.asyncIterator](): AsyncIterator<string> {
      return {
        async next(): Promise<IteratorResult<string>> {
          for (;;) {
            const head = queue.shift();
            if (head !== undefined) return { done: false, value: head };
            if (failure !== undefined) throw failure;
            if (done) return { done: true, value: undefined };
            await new Promise<void>((resolve) => {
              wake = resolve;
            });
          }
        },
      };
    },
  };
}

function renderPrompt(req: ProviderRequest): string {
  const parts: string[] = [];
  if (req.systemMessage !== undefined) parts.push(`[system] ${req.systemMessage}`);
  for (const msg of req.messages) {
    const text =
      typeof msg.content === 'string'
        ? msg.content
        : msg.content
            .map((p) => (p.type === 'text' ? p.text : p.type === 'reasoning' ? p.text : ''))
            .join('');
    parts.push(`[${msg.role}] ${text}`);
  }
  return parts.join('\n');
}

function basename(path: string): string {
  const idx = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return idx === -1 ? path : path.slice(idx + 1);
}

function lengthOf(tokens: readonly number[] | Uint32Array | Uint8Array | null | undefined): number {
  if (tokens === null || tokens === undefined) return 0;
  return (tokens as { length?: number }).length ?? 0;
}
