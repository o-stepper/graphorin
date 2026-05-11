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
import { applyReasoningPolicy, resolveReasoningRetention } from '@graphorin/provider/reasoning';

import {
  type LlamaCppNodeRuntimeOverrides,
  type LlamaModelInstance,
  type LlamaSessionInstance,
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
   * Optional session factory override. When unset, the adapter calls
   * the runtime's `createSession(...)`.
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
    options.sessionFactory ?? options.runtimeOverrides?.createSession ?? defaultSessionFactory;
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
      for await (const event of events) {
        if (event.type === 'text-delta') collected.push(event.delta);
        if (event.type === 'finish') {
          usage = event.usage;
          finishReason = event.finishReason;
        }
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
    yield { type: 'error', error: { kind: 'unknown', message: (err as Error).message } };
  }
  yield {
    type: 'finish',
    finishReason: 'stop',
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

function defaultSessionFactory(_model: LlamaModelInstance): Promise<LlamaSessionInstance> {
  return Promise.reject(
    new Error(
      '[graphorin/provider-llamacpp-node] no sessionFactory configured. ' +
        'Pass one explicitly or supply runtimeOverrides.createSession.',
    ),
  );
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
