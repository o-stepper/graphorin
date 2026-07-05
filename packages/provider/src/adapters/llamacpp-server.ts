/**
 * Direct adapter for the upstream `llama-server` binary from the
 * llama.cpp project. The binary speaks the OpenAI-compatible REST
 * contract end-to-end (`POST /v1/chat/completions`, `POST /v1/completions`,
 * `POST /v1/embeddings`); streaming is via `text/event-stream` chunks
 * terminated by `data: [DONE]` exactly as the upstream OpenAI shape.
 *
 * The adapter shares a single `LocalProviderTrust` classifier with
 * `ollamaAdapter` and `openAICompatibleAdapter` - one classifier, one
 * policy table, one error type.
 *
 * @packageDocumentation
 */

import type { Provider, Sensitivity } from '@graphorin/core';

import { buildOpenAIShapedProvider } from '../internal/openai-shaped.js';

/**
 * Default port used by the upstream `llama-server` binary.
 *
 * @stable
 */
export const DEFAULT_LLAMACPP_SERVER_BASE_URL = 'http://127.0.0.1:8080';

/**
 * Options accepted by {@link llamaCppServerAdapter}.
 *
 * @stable
 */
export interface LlamaCppServerAdapterOptions {
  /** GGUF model identifier exposed by the running server (e.g. `'qwen2.5:7b-instruct-q4_k_m'`). */
  readonly model: string;
  /** Base URL of the running `llama-server` process. Defaults to `http://127.0.0.1:8080`. */
  readonly baseUrl?: string;
  /** Optional bearer-auth API key (`--api-key` flag on the server). */
  readonly apiKey?: string;
  /** Extra headers merged on top of `content-type` + `accept` defaults. */
  readonly headers?: Readonly<Record<string, string>>;
  /** Custom `fetch` implementation; useful for tests. */
  readonly fetchImpl?: typeof fetch;
  /**
   * Time-to-response budget per request (PS-24). Default
   * `DEFAULT_REQUEST_TIMEOUT_MS` (120s); `0` disables.
   */
  readonly timeoutMs?: number;
  /** Capability overrides merged on top of the adapter defaults. */
  readonly capabilities?: Partial<import('@graphorin/core').ProviderCapabilities>;
  /**
   * Acknowledge the risk of running over plaintext HTTP against a
   * public host. Without this flag the adapter throws
   * {@link import('../errors/errors.js').LocalProviderInsecureTransportError}.
   */
  readonly allowInsecureTransport?: boolean;
  /** Override for the default `acceptsSensitivity` value. */
  readonly acceptsSensitivity?: ReadonlyArray<Sensitivity>;
  /** Provider name attached to spans / log lines. */
  readonly name?: string;
  /** Optional log sink. Tests pass a fixture sink to silence the console. */
  readonly logger?: (level: 'warn' | 'info', message: string, meta?: object) => void;
}

/**
 * Build a Graphorin {@link Provider} backed by the upstream
 * `llama-server` binary. The factory does not start the binary -
 * operators launch it themselves with the desired model + GPU flags
 * and pass the URL here.
 *
 * @example
 * ```ts
 * const local = createProvider(
 *   llamaCppServerAdapter({
 *     model: 'qwen2.5:7b-instruct-q4_k_m',
 *     baseUrl: 'http://127.0.0.1:8080',
 *   }),
 * );
 * ```
 *
 * @stable
 */
export function llamaCppServerAdapter(options: LlamaCppServerAdapterOptions): Provider {
  const baseUrl = options.baseUrl ?? DEFAULT_LLAMACPP_SERVER_BASE_URL;
  const providerName = options.name ?? `llamacpp-server-${options.model}`;
  const built = buildOpenAIShapedProvider({
    providerName,
    model: options.model,
    baseUrl,
    ...(options.apiKey !== undefined ? { apiKey: options.apiKey } : {}),
    ...(options.headers !== undefined ? { headers: options.headers } : {}),
    ...(options.fetchImpl !== undefined ? { fetchImpl: options.fetchImpl } : {}),
    ...(options.allowInsecureTransport !== undefined
      ? { allowInsecureTransport: options.allowInsecureTransport }
      : {}),
    ...(options.acceptsSensitivity !== undefined
      ? { acceptsSensitivity: options.acceptsSensitivity }
      : {}),
    ...(options.logger !== undefined ? { logger: options.logger } : {}),
    ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
    capabilities: { multimodal: false, parallelToolCalls: false, ...options.capabilities },
  });
  return built.provider;
}
