/**
 * Replay endpoints with scope enforcement.
 *
 *   POST   /v1/runs/:runId/replay
 *   POST   /v1/sessions/:id/replay
 *
 * Scope rules:
 *   - `raw: false` (default) → require `traces:read:sanitized`.
 *   - `raw: true`            → require `traces:read:raw` (admin).
 *
 * Every successful invocation appends a `trace.replay.accessed` audit
 * entry. The audit write is best-effort: a missing `AuditDb` does not
 * block the replay.
 *
 * The actual replay stream is consumer-supplied — the framework
 * accepts a `ReplayApi` from the operator that knows how to load
 * trace events for a `runId` / `sessionId`. Phase 14c only owns the
 * scope check + audit + transport.
 *
 * @packageDocumentation
 */

import { type AuditDb, appendAudit } from '@graphorin/security/audit';
import { type ParsedScope, parseScope, scopeMatches } from '@graphorin/security/auth';
import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { z } from 'zod';

import type { AuthState, ServerVariables } from '../internal/context.js';

/** @stable */
export type ReplayMode = 'sanitized' | 'raw';

/** @stable */
export interface ReplayApi {
  loadRunReplay(input: {
    readonly runId: string;
    readonly mode: ReplayMode;
    readonly fromMessageId?: string;
    readonly provider?: string;
  }): Promise<ReplayResponse>;
  loadSessionReplay(input: {
    readonly sessionId: string;
    readonly mode: ReplayMode;
    readonly fromMessageId?: string;
    readonly provider?: string;
  }): Promise<ReplayResponse>;
}

/** @stable */
export interface ReplayResponse {
  readonly events: ReadonlyArray<unknown>;
  readonly truncated?: boolean;
  readonly nextCursor?: string;
}

const SCOPE_SANITIZED: ParsedScope = parseScope('traces:read:sanitized');
const SCOPE_RAW: ParsedScope = parseScope('traces:read:raw');

const ReplayRequestSchema = z
  .object({
    raw: z.boolean().optional(),
    fromMessageId: z.string().min(1).optional(),
    provider: z.string().min(1).optional(),
  })
  .strict()
  .default({});

/**
 * @stable
 */
export interface ReplayRoutesDeps {
  readonly replay: ReplayApi;
  readonly auditDb?: AuditDb;
  readonly now?: () => number;
}

/**
 * @stable
 */
export function createReplayRoutes(deps: ReplayRoutesDeps): Hono<{ Variables: ServerVariables }> {
  const app = new Hono<{ Variables: ServerVariables }>();
  const now = deps.now ?? Date.now;

  app.post('/runs/:runId/replay', async (c) => {
    const runId = c.req.param('runId');
    const body = ReplayRequestSchema.safeParse(await safelyParseJson(c));
    if (!body.success) {
      return c.json(buildValidationError('Invalid replay body.', body.error.issues), 400);
    }
    const mode: ReplayMode = body.data.raw === true ? 'raw' : 'sanitized';
    const auth = c.get('state').auth;
    const scopeError = enforceReplayScope(auth, mode);
    if (scopeError !== undefined) {
      await maybeAppendAudit(deps.auditDb, {
        actor: auditActor(auth),
        action: 'replay:skipped',
        target: `run:${runId}`,
        decision: 'denied',
        ts: now(),
        metadata: { mode, reason: scopeError.code },
      });
      return c.json(scopeError.body, scopeError.status);
    }
    const replay = await deps.replay.loadRunReplay({
      runId,
      mode,
      ...(body.data.fromMessageId !== undefined ? { fromMessageId: body.data.fromMessageId } : {}),
      ...(body.data.provider !== undefined ? { provider: body.data.provider } : {}),
    });
    await maybeAppendAudit(deps.auditDb, {
      actor: auditActor(auth),
      action: 'replay:accessed',
      target: `run:${runId}`,
      decision: 'success',
      ts: now(),
      metadata: { mode, eventCount: replay.events.length },
    });
    return c.json(serializeReplay(replay, mode));
  });

  app.post('/sessions/:id/replay', async (c) => {
    const sessionId = c.req.param('id');
    const body = ReplayRequestSchema.safeParse(await safelyParseJson(c));
    if (!body.success) {
      return c.json(buildValidationError('Invalid replay body.', body.error.issues), 400);
    }
    const mode: ReplayMode = body.data.raw === true ? 'raw' : 'sanitized';
    const auth = c.get('state').auth;
    const scopeError = enforceReplayScope(auth, mode);
    if (scopeError !== undefined) {
      await maybeAppendAudit(deps.auditDb, {
        actor: auditActor(auth),
        action: 'replay:skipped',
        target: `session:${sessionId}`,
        decision: 'denied',
        ts: now(),
        metadata: { mode, reason: scopeError.code },
      });
      return c.json(scopeError.body, scopeError.status);
    }
    const replay = await deps.replay.loadSessionReplay({
      sessionId,
      mode,
      ...(body.data.fromMessageId !== undefined ? { fromMessageId: body.data.fromMessageId } : {}),
      ...(body.data.provider !== undefined ? { provider: body.data.provider } : {}),
    });
    await maybeAppendAudit(deps.auditDb, {
      actor: auditActor(auth),
      action: 'replay:accessed',
      target: `session:${sessionId}`,
      decision: 'success',
      ts: now(),
      metadata: { mode, eventCount: replay.events.length },
    });
    return c.json(serializeReplay(replay, mode));
  });

  return app;
}

interface ScopeRefusal {
  readonly code: 'auth-required' | 'scope-denied';
  readonly status: ContentfulStatusCode;
  readonly body: { readonly error: string; readonly message: string; readonly hint?: string };
}

function enforceReplayScope(auth: AuthState, mode: ReplayMode): ScopeRefusal | undefined {
  // IP-13: both a verified token and the no-auth anonymous principal carry a
  // `grantedScopes` set; only a genuinely unauthenticated request is refused.
  if (auth.kind === 'unauthenticated') {
    return {
      code: 'auth-required',
      status: 401,
      body: {
        error: 'auth-required',
        message: 'Authentication required for replay endpoints.',
      },
    };
  }
  const required = mode === 'raw' ? SCOPE_RAW : SCOPE_SANITIZED;
  for (const scope of auth.grantedScopes) {
    if (scopeMatches(scope, required)) return undefined;
  }
  return {
    code: 'scope-denied',
    status: 403,
    body: {
      error: 'scope-denied',
      message: `Token lacks required scope '${required.raw}'.`,
      hint: `Mint a token with the '${required.raw}' (or admin:*) scope.`,
    },
  };
}

function auditActor(auth: AuthState): {
  readonly kind: 'token' | 'system';
  readonly id: string;
  readonly label?: string;
} {
  if (auth.kind === 'token') {
    return {
      kind: 'token',
      id: auth.token.tokenId,
      ...(auth.token.label !== undefined ? { label: auth.token.label } : {}),
    };
  }
  // IP-13: attribute no-auth replays to the synthetic 'anonymous' principal.
  return { kind: 'system', id: auth.kind === 'anonymous' ? 'anonymous' : 'unauthenticated' };
}

async function maybeAppendAudit(
  auditDb: AuditDb | undefined,
  entry: Parameters<typeof appendAudit>[1],
): Promise<void> {
  if (auditDb === undefined) return;
  try {
    await appendAudit(auditDb, entry);
  } catch {
    // Best-effort — replay must not be blocked by audit failures.
  }
}

function serializeReplay(replay: ReplayResponse, mode: ReplayMode): Record<string, unknown> {
  return {
    mode,
    events: [...replay.events],
    ...(replay.truncated === true ? { truncated: true } : {}),
    ...(replay.nextCursor !== undefined ? { nextCursor: replay.nextCursor } : {}),
  };
}

function buildValidationError(
  message: string,
  issues: ReadonlyArray<{
    readonly path: ReadonlyArray<string | number>;
    readonly message: string;
  }>,
): Record<string, unknown> {
  return {
    error: 'config-invalid',
    message,
    issues: issues.map((i) => ({ path: i.path, message: i.message })),
  };
}

async function safelyParseJson(c: {
  readonly req: { readonly json: () => Promise<unknown> };
}): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}
