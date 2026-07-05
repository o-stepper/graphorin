import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

import { SecretAccessDeniedError } from './errors.js';
import {
  _setSecretValueCallerContextProvider,
  SecretValue,
  type SecretValueCallerContext,
} from './secret-value.js';

/**
 * Per-call context kept in `AsyncLocalStorage`. Carries the current
 * tool's allowlist, identifier, and run/session bookkeeping that the
 * audit log uses for attribution.
 *
 * @stable
 */
export interface ToolSecretsContext {
  /** Stable name of the currently-executing tool. */
  readonly toolName: string;
  /** Stable identifier of the run that initiated this scope. */
  readonly runId?: string;
  /** Identifier of the session, if known. */
  readonly sessionId?: string;
  /** Identifier of the agent owning the scope, if known. */
  readonly agentId?: string;
  /** Effective allowlist for the current scope. */
  readonly secretsAllowed: ReadonlyArray<string>;
  /** Lightweight pointer to the parent scope, for sub-agent isolation. */
  readonly parent?: ToolSecretsContext;
}

const toolContext = new AsyncLocalStorage<ToolSecretsContext>();

/**
 * Run `fn` with `ctx` set as the active per-tool secrets context. Used
 * by `@graphorin/tools` and `@graphorin/agent` to wrap tool/agent
 * execution.
 *
 * @stable
 */
export function withToolSecretsContext<T>(ctx: ToolSecretsContext, fn: () => T): T {
  return toolContext.run(Object.freeze(ctx), fn);
}

/**
 * Read the active per-tool secrets context, if any. Returns
 * `undefined` outside an explicit `withToolSecretsContext(...)` scope -
 * which means "no ACL enforcement".
 *
 * @stable
 */
export function getActiveToolSecretsContext(): ToolSecretsContext | undefined {
  return toolContext.getStore();
}

/**
 * Throw `SecretAccessDeniedError` if a tool context is active and the
 * key is not in its allowlist. No-op when no tool context is active.
 *
 * @stable
 */
/**
 * SPL-14: ACL gate for the non-throwing `get()` path. Inside an active
 * tool scope a denied key must read as ABSENT instead of bypassing the
 * per-tool allowlist (any code holding the raw store could otherwise
 * read every key). Returns `true` when the read may proceed; `true`
 * outside any tool scope (host-level reads stay un-gated).
 *
 * @stable
 */
export function secretAclAllowsRead(key: string): boolean {
  const ctx = toolContext.getStore();
  if (!ctx) return true;
  return ctx.secretsAllowed.includes(key);
}

export function enforceSecretAcl(key: string): void {
  const ctx = toolContext.getStore();
  if (!ctx) return;
  if (!ctx.secretsAllowed.includes(key)) {
    throw new SecretAccessDeniedError(key, ctx.toolName, ctx.secretsAllowed);
  }
}

/**
 * Compute the **effective** allowlist for a child scope: intersection
 * of the parent's allowlist and the child's declared list. The
 * intersection is the foundation of the deny-by-default sub-agent
 * inheritance contract - passing an additional key in a child only
 * works when the parent already permits it.
 *
 * @stable
 */
export function computeEffectiveAllowlist(
  parent: ToolSecretsContext | undefined,
  declared: ReadonlyArray<string>,
): ReadonlyArray<string> {
  if (!parent) return Object.freeze([...new Set(declared)]);
  const parentSet = new Set(parent.secretsAllowed);
  const out: string[] = [];
  for (const key of declared) {
    if (parentSet.has(key)) out.push(key);
  }
  return Object.freeze([...new Set(out)]);
}

/**
 * Convenience: run `fn` inside a child scope rooted at the current
 * active context. Used by `@graphorin/agent` to wire sub-agent calls.
 *
 * @stable
 */
export function withChildToolSecretsContext<T>(
  child: Omit<ToolSecretsContext, 'parent'>,
  fn: () => T,
): T {
  const parent = toolContext.getStore();
  const ctx: ToolSecretsContext = {
    ...child,
    secretsAllowed: computeEffectiveAllowlist(parent, child.secretsAllowed),
    ...(parent ? { parent } : {}),
  };
  return toolContext.run(Object.freeze(ctx), fn);
}

/**
 * Mirror of the `@graphorin/core` audit emitter contract for secret
 * unwrap events. Sub-package 03b subscribes through `onSecretValueAudit`
 * (see `secret-value.ts`); the ACL layer additionally emits **scope**
 * events for each `withSecret(...)` invocation.
 *
 * @stable
 */
export interface WithSecretAuditEvent {
  readonly action: 'with-secret';
  readonly toolName?: string;
  readonly scopeId: string;
  readonly caller?: string;
  readonly durationMs: number;
  readonly ts: number;
}

type WithSecretListener = (event: WithSecretAuditEvent) => void;

const withSecretListeners = new Set<WithSecretListener>();

/**
 * Subscribe to `withSecret(...)` scope events.
 *
 * @stable
 */
export function onWithSecretAudit(listener: WithSecretListener): () => void {
  withSecretListeners.add(listener);
  return () => {
    withSecretListeners.delete(listener);
  };
}

/**
 * Reset listener set. Used by tests.
 *
 * @experimental
 */
export function _resetWithSecretListenersForTesting(): void {
  withSecretListeners.clear();
}

function emitWithSecret(event: WithSecretAuditEvent): void {
  if (withSecretListeners.size === 0) return;
  for (const listener of withSecretListeners) {
    try {
      listener(event);
    } catch {
      // Audit listeners are isolated; never let a bad listener tear
      // down the secret access path.
    }
  }
}

/**
 * AsyncLocalStorage that carries the active `withSecret(...)` scope.
 * Tests inspect it; the `SecretValue` class reads it through the
 * provider hook so we keep the no-context fast path zero-overhead.
 */
const withSecretContext = new AsyncLocalStorage<SecretValueCallerContext>();

/**
 * Run `fn` with the unwrapped value. Auto-wraps raw strings into a
 * `SecretValue` so callers migrating from raw-string APIs do not have
 * to wrap manually. Records a single audit event per scope.
 *
 * @stable
 */
export async function withSecret<T>(
  value: string | SecretValue,
  fn: (raw: string) => T | Promise<T>,
  opts: { caller?: string } = {},
): Promise<T> {
  const wrapped =
    typeof value === 'string'
      ? SecretValue.fromString(value, { source: { resolver: 'inline', ref: 'inline:withSecret' } })
      : value;
  const scopeId = randomUUID();
  const tool = toolContext.getStore();
  const start = Date.now();
  return withSecretContext.run(
    {
      scopeId,
      ...(opts.caller ? { caller: opts.caller } : tool ? { caller: tool.toolName } : {}),
    },
    async () => {
      try {
        return await wrapped.use(fn);
      } finally {
        emitWithSecret({
          action: 'with-secret',
          scopeId,
          ...(opts.caller ? { caller: opts.caller } : tool ? { caller: tool.toolName } : {}),
          ...(tool ? { toolName: tool.toolName } : {}),
          durationMs: Date.now() - start,
          ts: start,
        });
        // Ephemeral scope - dispose only the wrappers we created.
        if (typeof value === 'string') wrapped.dispose();
      }
    },
  );
}

// Wire the ALS-backed caller-context provider into the SecretValue
// class so reveal/use audit events carry the active scope identifier.
_setSecretValueCallerContextProvider(() => {
  const inWithSecret = withSecretContext.getStore();
  if (inWithSecret) return inWithSecret;
  const tool = toolContext.getStore();
  if (tool) return { caller: tool.toolName };
  return undefined;
});
