/**
 * Session REST routes. Delegates to a structurally-typed `SessionApi`
 * supplied by the operator (in practice, the `@graphorin/sessions`
 * package's `SessionManager`); the contract is intentionally open so
 * tests can stub it without dragging the full sessions facade in.
 *
 *   GET    /sessions                     (scope `sessions:read`)
 *   GET    /sessions/:id                 (scope `sessions:read`)
 *   POST   /sessions                     (idempotent; scope `sessions:write`)
 *   DELETE /sessions/:id                 (scope `sessions:write`)
 *   GET    /sessions/:id/messages        (scope `sessions:read`)
 *   GET    /sessions/:id/handoffs        (scope `sessions:read`)
 *   POST   /sessions/:id/export          (scope `sessions:export`)
 *
 * @packageDocumentation
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { ServerVariables } from '../internal/context.js';
import { INVALID_JSON_BODY, readJsonBody } from '../internal/json.js';
import { createScopeMiddleware } from '../middleware/scope.js';

/**
 * Minimal contract route handlers consume. Real deployments wire
 * `@graphorin/sessions.SessionManager` in directly; tests pass a
 * lighter stub.
 *
 * @stable
 */
export interface SessionApi {
  list(opts: {
    readonly userId?: string;
    readonly agentId?: string;
  }): Promise<ReadonlyArray<unknown>>;
  get(sessionId: string): Promise<unknown | null>;
  create(input: {
    readonly userId: string;
    readonly agentId: string;
    readonly sessionId?: string;
    readonly title?: string;
    readonly tags?: ReadonlyArray<string>;
  }): Promise<unknown>;
  remove(sessionId: string): Promise<boolean>;
  listMessages(
    sessionId: string,
    opts: { readonly limit?: number },
  ): Promise<ReadonlyArray<unknown>>;
  listHandoffs(sessionId: string): Promise<ReadonlyArray<unknown>>;
  exportSession?(
    sessionId: string,
    opts: {
      readonly includeAuditEntries?: boolean;
      readonly hash?: boolean;
    },
  ): Promise<unknown>;
  replaySession?(
    sessionId: string,
    opts: { readonly raw?: boolean; readonly fromMessageId?: string },
  ): AsyncIterable<unknown>;
}

const CreateBodySchema = z
  .object({
    userId: z.string().min(1),
    agentId: z.string().min(1),
    sessionId: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    tags: z.array(z.string()).optional(),
  })
  .strict();

const MessagesQuerySchema = z
  .object({
    limit: z.coerce.number().int().positive().max(1000).optional(),
  })
  .strict();

const ExportBodySchema = z
  .object({
    includeAuditEntries: z.boolean().optional(),
    hash: z.boolean().optional(),
  })
  .strict()
  .default({});

const _ReplayBodySchema = z
  .object({
    raw: z.boolean().optional(),
    fromMessageId: z.string().min(1).optional(),
  })
  .strict()
  .default({});

/**
 * @stable
 */
export interface SessionRoutesDeps {
  readonly sessions: SessionApi;
}

/**
 * @stable
 */
export function createSessionRoutes(deps: SessionRoutesDeps): Hono<{ Variables: ServerVariables }> {
  const app = new Hono<{ Variables: ServerVariables }>();

  app.get('/', createScopeMiddleware('sessions:read'), async (c) => {
    const userId = c.req.query('userId');
    const agentId = c.req.query('agentId');
    const filter: { userId?: string; agentId?: string } = {};
    if (userId !== undefined && userId.length > 0) filter.userId = userId;
    if (agentId !== undefined && agentId.length > 0) filter.agentId = agentId;
    const list = await deps.sessions.list(filter);
    return c.json({ sessions: list });
  });

  app.post('/', createScopeMiddleware('sessions:write'), async (c) => {
    const raw = await readJsonBody(c);
    if (raw === INVALID_JSON_BODY) {
      return c.json({ error: 'invalid-json', message: 'Request body is not valid JSON.' }, 400);
    }
    const parsed = CreateBodySchema.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        {
          error: 'config-invalid',
          message: 'Invalid session body.',
          issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
        },
        400,
      );
    }
    const session = await deps.sessions.create({
      userId: parsed.data.userId,
      agentId: parsed.data.agentId,
      ...(parsed.data.sessionId !== undefined ? { sessionId: parsed.data.sessionId } : {}),
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.tags !== undefined ? { tags: parsed.data.tags } : {}),
    });
    return c.json({ session }, 201);
  });

  // W-107: per-resource requirement - a token scoped to ONE session
  // reads it on every surface (WS subjects already gated per-resource;
  // wide two-segment grants keep covering three-segment requirements).
  app.get(
    '/:id',
    createScopeMiddleware((_path, params) => `sessions:read:${params.id}`),
    async (c) => {
      const id = c.req.param('id');
      const session = await deps.sessions.get(id);
      if (session === null) {
        return c.json({ error: 'session-not-found', message: `Session '${id}' not found.` }, 404);
      }
      return c.json({ session });
    },
  );

  app.delete(
    '/:id',
    createScopeMiddleware((_path, params) => `sessions:write:${params.id}`),
    async (c) => {
      const id = c.req.param('id');
      const removed = await deps.sessions.remove(id);
      if (!removed) {
        return c.json({ error: 'session-not-found', message: `Session '${id}' not found.` }, 404);
      }
      return c.body(null, 204);
    },
  );

  app.get(
    '/:id/messages',
    createScopeMiddleware((_path, params) => `sessions:read:${params.id}`),
    async (c) => {
      const id = c.req.param('id');
      const parsed = MessagesQuerySchema.safeParse({ limit: c.req.query('limit') });
      if (!parsed.success) {
        return c.json(
          {
            error: 'config-invalid',
            message: 'Invalid messages query.',
            issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
          },
          400,
        );
      }
      const opts: { limit?: number } = {};
      if (parsed.data.limit !== undefined) opts.limit = parsed.data.limit;
      const messages = await deps.sessions.listMessages(id, opts);
      return c.json({ sessionId: id, messages });
    },
  );

  app.get(
    '/:id/handoffs',
    createScopeMiddleware((_path, params) => `sessions:read:${params.id}`),
    async (c) => {
      const id = c.req.param('id');
      const handoffs = await deps.sessions.listHandoffs(id);
      return c.json({ sessionId: id, handoffs });
    },
  );

  app.post(
    '/:id/export',
    createScopeMiddleware((_path, params) => `sessions:export:${params.id}`),
    async (c) => {
      const id = c.req.param('id');
      if (deps.sessions.exportSession === undefined) {
        return c.json(
          { error: 'session-export-unsupported', message: 'Export is not enabled.' },
          400,
        );
      }
      const raw = await readJsonBody(c);
      if (raw === INVALID_JSON_BODY) {
        return c.json({ error: 'invalid-json', message: 'Request body is not valid JSON.' }, 400);
      }
      const parsed = ExportBodySchema.safeParse(raw);
      if (!parsed.success) {
        return c.json(
          {
            error: 'config-invalid',
            message: 'Invalid export body.',
            issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
          },
          400,
        );
      }
      const exportOpts: { includeAuditEntries?: boolean; hash?: boolean } = {};
      if (parsed.data.includeAuditEntries !== undefined) {
        exportOpts.includeAuditEntries = parsed.data.includeAuditEntries;
      }
      if (parsed.data.hash !== undefined) exportOpts.hash = parsed.data.hash;
      const result = await deps.sessions.exportSession(id, exportOpts);
      return c.json({ sessionId: id, export: result });
    },
  );

  // IP-14: the session-replay route lives in `replay/routes.ts` (the
  // scope-laddered, audit-backed implementation). The Phase-14a stub
  // that lived here SHADOWED it (mounted earlier on the same path)
  // while advertising a `session:<id>/replay` subject the WS grammar
  // cannot parse - deleted.

  return app;
}
