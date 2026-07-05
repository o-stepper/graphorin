/**
 * Shared types for the audit-log surface.
 *
 * @packageDocumentation
 */

/**
 * Discriminator for the actor that initiated an audited action.
 *
 * @stable
 */
export type AuditActorKind = 'token' | 'cli' | 'agent' | 'tool' | 'system' | 'subagent';

/**
 * Pointer to who initiated an audited action. The audit log never
 * stores the secret value itself; only metadata that is safe to log.
 *
 * @stable
 */
export interface AuditActor {
  readonly kind: AuditActorKind;
  readonly id: string;
  readonly label?: string;
}

/**
 * Canonical action discriminator. Listed here as an open string union
 * so deployments can extend with their own actions without forking
 * the framework - but the well-known set is documented for tooling
 * (filter dropdowns, tests, etc.).
 *
 * @stable
 */
export type AuditAction =
  | 'secret:get'
  | 'secret:require'
  | 'secret:set'
  | 'secret:delete'
  | 'secret:list'
  | 'secret:cross-agent-access'
  | 'secrets:downgrade'
  | 'token:create'
  | 'token:revoke'
  | 'token:rotate'
  | 'token:rekey'
  | 'auth:granted'
  | 'auth:denied:unauth'
  | 'auth:denied:scope'
  | 'auth:denied:lockout'
  | 'oauth:granted'
  | 'oauth:refreshed'
  | 'oauth:revoked'
  | 'oauth:registered'
  | 'oauth:expired'
  | 'skill:installed'
  | 'skill:upgraded'
  | 'skill:audit'
  | 'guardrail:triggered'
  | 'memory:sensitivity-downgrade'
  | 'memory:modification:before'
  | 'memory:modification:after'
  | 'memory:guard:snapshot'
  | 'memory:guard:verified'
  | 'memory:guard:mismatch'
  | 'memory:guard:rolled-back'
  | 'memory:guard:exceeded-budget'
  | 'consolidator:run-started'
  | 'consolidator:run-completed'
  | 'replay:accessed'
  | 'replay:skipped'
  | 'audit:db-opened'
  | 'audit:pruned'
  | 'audit:exported'
  | (string & {});

/**
 * Decision recorded by the audit entry.
 *
 * @stable
 */
export type AuditDecision = 'success' | 'denied' | 'error' | 'not-found';

/**
 * Optional context surfaced alongside an audit entry. Each field is
 * filtered to safe metadata (no raw secret values) by the calling
 * site.
 *
 * @stable
 */
export interface AuditContext {
  readonly runId?: string;
  readonly sessionId?: string;
  readonly toolName?: string;
}

/**
 * Input to `appendAudit(...)`. Callers do not provide `seq`,
 * `prev_hash`, or `hash`; those are computed by the helper.
 *
 * @stable
 */
export interface AuditEntryInput {
  readonly actor: AuditActor;
  readonly action: AuditAction;
  readonly target: string;
  readonly decision: AuditDecision;
  readonly context?: AuditContext;
  readonly metadata?: Readonly<Record<string, unknown>>;
  /**
   * Override the timestamp. Defaults to `Date.now()`. Tests pass a
   * deterministic value here; production code never sets this.
   */
  readonly ts?: number;
}

/**
 * Concrete on-disk audit entry. The `hash` and `prev_hash` fields are
 * always 64-char hex SHA-256 digests.
 *
 * @stable
 */
export interface StoredAuditEntry {
  readonly seq: number;
  readonly ts: number;
  readonly actor: AuditActor;
  readonly action: AuditAction;
  readonly target: string;
  readonly decision: AuditDecision;
  readonly context?: AuditContext;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly prevHash: string;
  readonly hash: string;
}

/**
 * Result of `verifyAuditChain(...)`. Walks the chain from `from` to
 * `to` and returns either `{ ok: true, count }` or
 * `{ ok: false, brokenAt, expected, actual }`.
 *
 * @stable
 */
export type AuditChainVerifyResult =
  | { readonly ok: true; readonly count: number }
  | {
      readonly ok: false;
      readonly brokenAt: number;
      readonly expected: string;
      readonly actual: string;
    };
