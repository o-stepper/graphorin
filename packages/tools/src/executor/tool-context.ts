/**
 * Build a per-call {@link ToolExecutionContext} for a single
 * `Tool.execute(...)` invocation.
 *
 * The context wires together:
 *
 *  - the parent `RunContext` (so the tool sees the same `signal`,
 *    `tracer`, `usage`, `messages`, …),
 *  - a tool-scoped `signal` linked to the parent's `signal`,
 *  - a structured `Logger` derived from the run's logger,
 *  - the streaming progress / content emitters (no-op when
 *    `streamingHint !== true`),
 *  - the per-call secrets accessor scoped to the tool's
 *    `secretsAllowed` ACL.
 *
 * @packageDocumentation
 */

import type {
  ContentChunk,
  Logger,
  ResolvedTool,
  RunContext,
  SecretValue,
  ToolExecutionContext,
  ToolSecretsAccessor,
  Tracer,
} from '@graphorin/core';
import { NOOP_LOGGER, NOOP_TRACER } from '@graphorin/core';
import { enforceSecretAcl, withChildToolSecretsContext } from '@graphorin/security/secrets';

import type { StreamingChannel } from '../streaming/channel.js';

/**
 * Resolver hook the executor wires to the configured `SecretsStore` —
 * implementations call `resolve(key)` and either return the resolved
 * `SecretValue` or `null` when the key is absent.
 *
 * @stable
 */
export interface SecretResolverHook {
  resolve(key: string): Promise<SecretValue | null>;
}

/** Configuration for {@link buildToolExecutionContext}. */
export interface ToolContextOptions<TDeps = unknown> {
  readonly tool: ResolvedTool<unknown, unknown, TDeps>;
  readonly toolCallId: string;
  readonly runContext: RunContext<TDeps>;
  readonly signal: AbortSignal;
  readonly streamingChannel: StreamingChannel;
  readonly tracer?: Tracer;
  readonly logger?: Logger;
  /** The secrets resolver injected by the agent runtime. */
  readonly secretResolver?: SecretResolverHook;
}

/**
 * Build a {@link ToolExecutionContext} for one invocation. The
 * returned context honours the tool's `secretsAllowed` ACL — calls to
 * `ctx.secrets.require(...)` for keys outside the allowlist throw
 * `SecretAccessDeniedError`.
 *
 * The context also wires the streaming surface: `ctx.reportProgress`
 * + `ctx.streamContent` are no-ops when the tool's `__streamingHint`
 * is `false`.
 *
 * @stable
 */
export function buildToolExecutionContext<TDeps = unknown>(
  opts: ToolContextOptions<TDeps>,
): ToolExecutionContext<TDeps> {
  const { tool, toolCallId, runContext, signal } = opts;
  const tracer = opts.tracer ?? runContext.tracer ?? NOOP_TRACER;
  const logger = opts.logger ?? NOOP_LOGGER;
  const accessor = makeSecretsAccessor(opts.secretResolver, tool.name);

  const reportProgress = (current: number, total?: number, message?: string): void => {
    opts.streamingChannel.reportProgress(current, total, message);
  };
  const streamContent = (chunk: ContentChunk): void => {
    opts.streamingChannel.streamContent(chunk);
  };

  return Object.freeze({
    toolCallId,
    runContext,
    signal,
    tracer,
    logger,
    secrets: accessor,
    reportProgress,
    streamContent,
  });
}

function makeSecretsAccessor(
  resolver: SecretResolverHook | undefined,
  toolName: string,
): ToolSecretsAccessor {
  function require(
    key: string,
    options?: { readonly optional?: boolean },
  ): Promise<SecretValue | SecretValue | null> {
    enforceSecretAcl(key);
    if (resolver === undefined) {
      if (options?.optional === true) return Promise.resolve(null);
      const err = new Error(
        `Tool "${toolName}" requested secret "${key}" but no secrets store is configured for this run.`,
      );
      Object.defineProperty(err, 'kind', { value: 'secret-required' });
      return Promise.reject(err);
    }
    return resolver.resolve(key).then((value) => {
      if (value === null && options?.optional !== true) {
        const err = new Error(
          `Tool "${toolName}" required secret "${key}" but the secrets store returned no value.`,
        );
        Object.defineProperty(err, 'kind', { value: 'secret-required' });
        throw err;
      }
      return value;
    });
  }
  return Object.freeze({ require: require as ToolSecretsAccessor['require'] });
}

/**
 * Internal helper — wrap a tool execution in the per-tool secrets
 * context that backs the ACL enforcement.
 *
 * @stable
 */
export function withSecretsScope<R>(opts: {
  readonly tool: ResolvedTool;
  readonly runContext: RunContext;
  readonly fn: () => R | Promise<R>;
}): R | Promise<R> {
  return withChildToolSecretsContext(
    {
      toolName: opts.tool.name,
      runId: opts.runContext.runId,
      sessionId: opts.runContext.sessionId,
      ...(opts.runContext.agentId !== undefined ? { agentId: opts.runContext.agentId } : {}),
      secretsAllowed: opts.tool.secretsAllowed ?? [],
    },
    opts.fn,
  );
}
