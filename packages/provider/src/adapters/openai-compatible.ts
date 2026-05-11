/**
 * Generic OpenAI-compatible adapter — works against any HTTP server
 * that speaks the `/v1/chat/completions` REST contract. Tested
 * deployments include LMStudio (default port 1234), LocalAI (default
 * port 8080), vLLM (`python -m vllm.entrypoints.openai.api_server`,
 * default port 8000), Together-style self-host endpoints, and any
 * other server in the OpenAI-compatible ecosystem.
 *
 * The adapter shares the same `LocalProviderTrust` classifier as
 * `ollamaAdapter` and `llamaCppServerAdapter` — one classifier, one
 * policy table, one error type.
 *
 * @packageDocumentation
 */

import type { Provider, Sensitivity } from '@graphorin/core';

import { buildOpenAIShapedProvider } from '../internal/openai-shaped.js';

/**
 * Options accepted by {@link openAICompatibleAdapter}.
 *
 * @stable
 */
export interface OpenAICompatibleAdapterOptions {
  /** Model identifier sent in the request body's `model` field. */
  readonly model: string;
  /**
   * Base URL of the OpenAI-compatible server. The classifier inspects
   * the protocol + host to assign a `LocalProviderTrust` value.
   */
  readonly baseUrl: string;
  /** Optional REST path override. Defaults to `/v1/chat/completions`. */
  readonly chatPath?: string;
  /** Optional bearer-auth API key. */
  readonly apiKey?: string;
  /** Extra headers merged on top of `content-type` + `accept` defaults. */
  readonly headers?: Readonly<Record<string, string>>;
  /** Custom `fetch` implementation; useful for tests. */
  readonly fetchImpl?: typeof fetch;
  /**
   * Acknowledge the risk of running over plaintext HTTP against a
   * public host.
   */
  readonly allowInsecureTransport?: boolean;
  /** Override for the default `acceptsSensitivity` value. */
  readonly acceptsSensitivity?: ReadonlyArray<Sensitivity>;
  /** Provider name attached to spans / log lines. */
  readonly name?: string;
  /** Optional log sink. */
  readonly logger?: (level: 'warn' | 'info', message: string, meta?: object) => void;
}

/**
 * Build a Graphorin {@link Provider} backed by an OpenAI-compatible
 * HTTP server. The same code path serves LMStudio, LocalAI, vLLM, and
 * any other compatible self-host endpoint.
 *
 * @stable
 */
export function openAICompatibleAdapter(options: OpenAICompatibleAdapterOptions): Provider {
  const providerName = options.name ?? `openai-compatible-${options.model}`;
  const built = buildOpenAIShapedProvider({
    providerName,
    model: options.model,
    baseUrl: options.baseUrl,
    ...(options.chatPath !== undefined ? { chatPath: options.chatPath } : {}),
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
  });
  return built.provider;
}
