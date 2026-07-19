/**
 * `llamaCppNodeAdapter` - in-process GGUF adapter built on
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
  type LlamaChatHistoryItem,
  type LlamaChatSessionPeer,
  type LlamaCppNodeRuntimeOverrides,
  type LlamaModelInstance,
  type LlamaSessionInstance,
  loadLlamaChatSessionCtor,
  loadLlamaModule,
} from './runtime.js';

/**
 * Default sensitivity envelope for the in-process adapter - same as
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
   * real session from the peer: `model.createContext()` →
   * `new LlamaChatSession({ contextSequence })`, streaming through
   * `prompt(text, { onTextChunk })`. Overrides
   * (`runtimeOverrides.createSession` or this option) keep the test
   * seam.
   */
  readonly sessionFactory?: (
    model: LlamaModelInstance,
    system?: string,
  ) => Promise<LlamaSessionInstance>;
  /**
   * Reuse ONE session (context + KV cache) across requests
   * instead of creating and disposing a fresh one per call - an agent
   * loop then avoids re-prefilling the growing transcript on every
   * step. Requests serialise through a promise mutex (a llama context
   * sequence is single-threaded), and the chat history re-syncs via
   * `setChatHistory` before each prompt. Strictly opt-in: the default
   * per-request lifecycle stays memory-safe and concurrency-safe; the
   * cached session also skips per-request disposal (it lives until the
   * process / instance is released). Sessions WITHOUT `setChatHistory`
   * cannot re-sync and silently degrade to per-request behaviour.
   */
  readonly persistentSession?: boolean;
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
  const acquireSession = buildSessionManager(options, sessionFactory);
  return {
    name: providerName,
    modelId: options.modelPath,
    capabilities,
    acceptsSensitivity,
    stream(req) {
      return streamLlamaCppNode(
        ensureModel,
        acquireSession,
        providerName,
        options,
        applyLlamaCppNodePreflight(req, capabilities),
      );
    },
    async generate(req) {
      const events = streamLlamaCppNode(
        ensureModel,
        acquireSession,
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
      // indistinguishable from success - and a never-throwing
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
  acquireSession: SessionManager,
  providerName: string,
  options: LlamaCppNodeAdapterOptions,
  req: ProviderRequest,
): AsyncIterable<ProviderEvent> {
  const { model } = await ensureModel();
  const lease = await acquireSession(
    model,
    typeof req.systemMessage === 'string' ? req.systemMessage : undefined,
  );
  const session = lease.session;
  // W-096: feed the transcript as REAL chat history when the session
  // supports it (node-llama-cpp v3 `setChatHistory`) and prompt ONLY
  // the last user turn - the pre-fix pseudo-prompt double-templated the
  // whole conversation inside one user turn, degrading chat-tuned GGUF
  // models. Sessions without the setter (older fixtures, custom
  // factories) keep the legacy renderPrompt path unchanged.
  const historic = typeof session.setChatHistory === 'function';
  let prompt: string;
  if (historic) {
    const { priorTurns, lastUserText } = buildChatHistory(req);
    session.setChatHistory?.(priorTurns);
    prompt = lastUserText;
  } else {
    prompt = renderPrompt(req);
  }
  // Prompt-token accounting stays the full-transcript proxy in both
  // modes so the figure is comparable regardless of the wire path.
  const promptTokens = lengthOf(model.tokenize(renderPrompt(req)));
  yield {
    type: 'stream-start',
    metadata: {
      providerName,
      modelId: options.modelPath,
      createdAt: new Date().toISOString(),
    },
  };
  const pieces: string[] = [];
  let errored = false;
  let aborted = false;
  try {
    const streamOptions: { signal?: AbortSignal; maxTokens?: number; temperature?: number } = {};
    if (req.signal !== undefined) streamOptions.signal = req.signal;
    if (req.maxTokens !== undefined) streamOptions.maxTokens = req.maxTokens;
    if (req.temperature !== undefined) streamOptions.temperature = req.temperature;
    for await (const piece of session.promptStreamingResponse(prompt, streamOptions)) {
      if (req.signal?.aborted) {
        aborted = true;
        break;
      }
      if (typeof piece !== 'string' || piece.length === 0) continue;
      pieces.push(piece);
      yield { type: 'text-delta', delta: piece };
      if (req.signal?.aborted) {
        aborted = true;
        break;
      }
    }
  } catch (err) {
    errored = true;
    yield { type: 'error', error: { kind: 'unknown', message: (err as Error).message } };
  } finally {
    lease.release();
  }
  // W-096: tokenize the ASSEMBLED response once - per-chunk tokenization
  // over-counted at every chunk boundary (BPE merges span chunk seams).
  const completionTokens = lengthOf(model.tokenize(pieces.join('')));
  yield {
    type: 'finish',
    // PS-4: a mid-stream failure must not masquerade as a clean stop -
    // partial text would be indistinguishable from success. PS-12: an
    // aborted stream reports 'aborted', mirroring the HTTP adapters.
    finishReason: errored ? 'error' : aborted ? 'aborted' : 'stop',
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    },
  };
}

/** Lease over a session: per-request leases dispose on release. */
interface SessionLease {
  readonly session: LlamaSessionInstance;
  release(): void;
}

type SessionManager = (model: LlamaModelInstance, system?: string) => Promise<SessionLease>;

/**
 * Per-request sessions by default (create -> use -> dispose, the
 * memory-safe lifecycle); with `persistentSession:
 * true` ONE cached session serialised by a promise mutex (a llama
 * context sequence is single-threaded) whose history re-syncs via
 * `setChatHistory` on every request. A cached session that turns out
 * not to support `setChatHistory` degrades to per-request behaviour -
 * without the setter its history cannot be made consistent.
 */
function buildSessionManager(
  options: LlamaCppNodeAdapterOptions,
  sessionFactory: (model: LlamaModelInstance, system?: string) => Promise<LlamaSessionInstance>,
): SessionManager {
  if (options.persistentSession !== true) {
    return async (model, system) => {
      const session = await sessionFactory(model, system);
      return {
        session,
        release: () => {
          // Release the per-request context / KV cache (core-provider-08).
          try {
            session.dispose?.();
          } catch {
            // Disposal failures must never mask the stream outcome.
          }
        },
      };
    };
  }
  let cached: LlamaSessionInstance | null = null;
  let queueTail: Promise<void> = Promise.resolve();
  return async (model, system) => {
    let unlock!: () => void;
    const gate = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    const priorTail = queueTail;
    queueTail = queueTail.then(() => gate);
    await priorTail;
    if (cached === null) cached = await sessionFactory(model, system);
    const session = cached;
    if (typeof session.setChatHistory !== 'function') {
      // Cannot re-sync history across requests - fall back to the
      // per-request lifecycle for THIS session and try again next call.
      cached = null;
      return {
        session,
        release: () => {
          try {
            session.dispose?.();
          } catch {
            // best-effort
          }
          unlock();
        },
      };
    }
    return { session, release: () => unlock() };
  };
}

/**
 * Split the request into node-llama-cpp chat-history turns plus
 * the trailing user text (the prompt). The system message is included
 * as a history item because `setChatHistory` REPLACES the session's
 * whole history - including the slot the constructor `systemPrompt`
 * seeded - so relying on the constructor alone would drop it. Tool
 * roles cannot occur (`toolCalling: false`); a defensive skip keeps a
 * stray one from corrupting the template.
 */
function buildChatHistory(req: ProviderRequest): {
  readonly priorTurns: ReadonlyArray<LlamaChatHistoryItem>;
  readonly lastUserText: string;
} {
  const turns: LlamaChatHistoryItem[] = [];
  if (typeof req.systemMessage === 'string' && req.systemMessage.length > 0) {
    turns.push({ type: 'system', text: req.systemMessage });
  }
  for (const msg of req.messages) {
    const text = textOf(msg);
    if (msg.role === 'user') turns.push({ type: 'user', text });
    else if (msg.role === 'assistant') turns.push({ type: 'model', response: [text] });
    else if (msg.role === 'system') turns.push({ type: 'system', text });
  }
  const last = turns[turns.length - 1];
  if (last !== undefined && last.type === 'user') {
    turns.pop();
    return { priorTurns: turns, lastUserText: last.text };
  }
  // No trailing user turn (continuation) - full history, empty prompt.
  return { priorTurns: turns, lastUserText: '' };
}

function textOf(msg: ProviderRequest['messages'][number]): string {
  return typeof msg.content === 'string'
    ? msg.content
    : msg.content
        .map((p) => (p.type === 'text' ? p.text : p.type === 'reasoning' ? p.text : ''))
        .join('');
}

async function resolveModel(options: LlamaCppNodeAdapterOptions): Promise<LlamaModelInstance> {
  const llama = await loadLlamaModule(options.runtimeOverrides);
  return llama.loadModel({
    modelPath: options.modelPath,
    ...(options.gpuLayers !== undefined ? { gpuLayers: options.gpuLayers } : {}),
  });
}

/**
 * The REAL default session factory: `model.createContext()` →
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
    dispose() {
      // Sequence first, then its owning context (core-provider-08).
      try {
        sequence.dispose?.();
      } catch {
        // fall through to the context
      }
      context.dispose?.();
    },
  };
}

/**
 * Bridge the peer's callback-streaming `prompt(...)` into the
 * AsyncIterable the adapter consumes. A rejection from `prompt`
 * rejects the pending/next iteration so the stream's error path
 * observes it.
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
  // `req.systemMessage` is deliberately NOT rendered here: the session
  // factory already sets it as the chat-template `systemPrompt`, and
  // rendering it again would show the model the system prompt twice
  // (core-provider-08).
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
