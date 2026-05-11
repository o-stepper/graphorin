/**
 * Audit middleware. Forwards every authenticated request through
 * `appendAudit` (`@graphorin/security/audit`) so the operator gets a
 * tamper-evident chain of every state-changing call. Append failures
 * never break the request hot path; they are recorded on a best-
 * effort error sink.
 *
 * @packageDocumentation
 */

import {
  type AuditDb,
  type AuditDecision,
  type AuditEntryInput,
  appendAudit,
} from '@graphorin/security/audit';
import type { MiddlewareHandler } from 'hono';

import type { ServerVariables } from '../internal/context.js';

/**
 * Canonical action discriminator emitted on every authenticated REST
 * request per the Phase 14a spec (`§ Audit middleware`). Exposed as
 * a constant so consumers (downstream filters, dashboards) can grep
 * for it without restating the literal everywhere.
 *
 * @stable
 */
export const HTTP_REQUEST_AUDIT_ACTION = 'http:request' as const;

/**
 * Optional telemetry sink. The default ignores errors; production
 * deployments wire this into their structured logger.
 *
 * @stable
 */
export type AuditErrorSink = (err: unknown, entry: Omit<AuditEntryInput, 'ts'>) => void;

/**
 * @stable
 */
export interface AuditMiddlewareOptions {
  readonly auditDb: AuditDb;
  /** Optional override for the time source. */
  readonly now?: () => number;
  /** Optional error sink. Defaults to swallow. */
  readonly onError?: AuditErrorSink;
  /**
   * When `true` (the default), include the path + method + status on
   * the audit entry's metadata. Disable for compliance-strict
   * deployments that already log the request envelope elsewhere.
   */
  readonly recordMetadata?: boolean;
}

function decisionForStatus(status: number): AuditDecision {
  if (status >= 500) return 'error';
  if (status === 404) return 'not-found';
  if (status >= 400) return 'denied';
  return 'success';
}

/**
 * @stable
 */
export function createAuditMiddleware(
  options: AuditMiddlewareOptions,
): MiddlewareHandler<{ Variables: ServerVariables }> {
  const now = options.now ?? Date.now;
  const onError = options.onError ?? (() => {});
  const recordMetadata = options.recordMetadata ?? true;

  return async (c, next) => {
    const start = now();
    await next();
    const status = c.res?.status ?? 0;
    const auth = c.get('state').auth;
    if (auth.kind !== 'token') {
      // Anonymous calls (health, etc.) are not audited.
      return;
    }
    const token = auth.token;
    const entry: AuditEntryInput = {
      ts: now(),
      actor: {
        kind: 'token',
        id: token.tokenId,
        ...(token.label !== undefined ? { label: token.label } : {}),
      },
      action: HTTP_REQUEST_AUDIT_ACTION,
      target: c.req.path,
      decision: decisionForStatus(status),
      ...(recordMetadata
        ? {
            metadata: {
              method: c.req.method,
              status,
              durationMs: now() - start,
              requestId: c.get('state').requestId,
              ...(c.get('state').idempotencyKey !== undefined
                ? { idempotencyKey: c.get('state').idempotencyKey }
                : {}),
              ...(c.get('state').idempotencyReplay === true ? { idempotencyReplayed: true } : {}),
            },
          }
        : {}),
    };
    try {
      await appendAudit(options.auditDb, entry);
    } catch (err) {
      onError(err, entry);
    }
  };
}
