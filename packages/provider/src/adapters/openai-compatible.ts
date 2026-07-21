/**
 * Generic OpenAI-compatible adapter - works against any HTTP server
 * that speaks the `/v1/chat/completions` REST contract. Tested
 * deployments include LMStudio (default port 1234), LocalAI (default
 * port 8080), vLLM (`python -m vllm.entrypoints.openai.api_server`,
 * default port 8000), Together-style self-host endpoints, and any
 * other server in the OpenAI-compatible ecosystem.
 *
 * The adapter shares the same `LocalProviderTrust` classifier as
 * `ollamaAdapter` and `llamaCppServerAdapter` - one classifier, one
 * policy table, one error type.
 *
 * @packageDocumentation
 */

import type { Provider, ProviderCapabilities, Sensitivity } from '@graphorin/core';

import {
  buildOpenAIShapedProvider,
  type TokenLimitParam,
  type UnsupportedParamRecovery,
} from '../internal/openai-shaped.js';

export type { TokenLimitParam, UnsupportedParamRecovery } from '../internal/openai-shaped.js';

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
  /**
   * Optional REST path override, appended to `baseUrl` verbatim.
   * Defaults to `/v1/chat/completions`, or to `/chat/completions` when
   * `baseUrl` already ends with `/v1` (the `api.openai.com/v1` /
   * LM Studio / vLLM convention), so both base-URL styles reach the
   * server's single real endpoint.
   */
  readonly chatPath?: string;
  /**
   * Which wire parameter carries `maxTokens`: classic `'max_tokens'`
   * (default; llama.cpp, LM Studio, vLLM, LocalAI) or
   * `'max_completion_tokens'` (current OpenAI models, which reject the
   * classic name with HTTP 400). When left unset, the adapter reacts to
   * that specific 400 by re-sending the request once with
   * `max_completion_tokens` and remembers the switch for the lifetime
   * of the provider instance; setting the option pins the name and
   * disables the auto-remap.
   */
  readonly tokenLimitParam?: TokenLimitParam;
  /**
   * One-shot HTTP 400 auto-recovery for model parameters the server
   * rejects: a 400 naming `temperature` re-sends the request without
   * the field (current OpenAI reasoning models accept only the
   * default), and a 400 requiring `reasoning_effort` `'none'` for
   * function tools on chat completions re-sends with it. The
   * instance keeps each switch and WARNs once. An explicit
   * `providerOptions` value for either field disables its recovery
   * so the override keeps failing loudly. Default `'auto'`; set
   * `'off'` to surface the original errors instead.
   */
  readonly unsupportedParamRecovery?: UnsupportedParamRecovery;
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
  /**
   * Capability overrides merged on top of the adapter defaults.
   * Use them to widen `contextWindow` /
   * `maxOutput` for large-context servers or to set
   * `structuredOutput: false` for servers that reject
   * `response_format`.
   */
  readonly capabilities?: Partial<ProviderCapabilities>;
  /**
   * Time-to-response budget per request. Default 120s; `0`
   * disables.
   */
  readonly timeoutMs?: number;
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
    ...(options.tokenLimitParam !== undefined ? { tokenLimitParam: options.tokenLimitParam } : {}),
    ...(options.unsupportedParamRecovery !== undefined
      ? { unsupportedParamRecovery: options.unsupportedParamRecovery }
      : {}),
    ...(options.apiKey !== undefined ? { apiKey: options.apiKey } : {}),
    ...(options.headers !== undefined ? { headers: options.headers } : {}),
    ...(options.fetchImpl !== undefined ? { fetchImpl: options.fetchImpl } : {}),
    ...(options.allowInsecureTransport !== undefined
      ? { allowInsecureTransport: options.allowInsecureTransport }
      : {}),
    ...(options.capabilities !== undefined ? { capabilities: options.capabilities } : {}),
    ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
    ...(options.acceptsSensitivity !== undefined
      ? { acceptsSensitivity: options.acceptsSensitivity }
      : {}),
    ...(options.logger !== undefined ? { logger: options.logger } : {}),
  });
  return built.provider;
}
