/**
 * Audit-log REST routes.
 *
 *   GET    /audit                      (scope `audit:read`)
 *   POST   /audit/export               (scope `audit:export`)
 *
 * The handler delegates to a structurally-typed `AuditApi` so the
 * server code stays decoupled from any single audit backend.
 *
 * @packageDocumentation
 */

import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';

import type { ServerVariables } from '../internal/context.js';
import { createScopeMiddleware } from '../middleware/scope.js';

/**
 * @stable
 */
export interface AuditApi {
  list(opts: {
    readonly limit?: number;
    readonly fromSeq?: number;
    /** Inclusive lower bound on the entry timestamp (epoch ms). */
    readonly fromTs?: number;
    /** Inclusive upper bound on the entry timestamp (epoch ms). */
    readonly toTs?: number;
    /** Restrict to entries whose `action` matches the supplied id. */
    readonly action?: string;
  }): Promise<ReadonlyArray<unknown>>;
  export(opts: {
    readonly fromSeq?: number;
    readonly toSeq?: number;
    readonly format?: 'jsonl' | 'csv';
  }): Promise<{ readonly bytes: number; readonly format?: 'jsonl' | 'csv' }>;
  /**
   * Verify the chain integrity of every audit row in the inclusive
   * range. Phase 14c surfaces this through `POST /v1/audit/verify`.
   * Optional — operators that opt out of the audit chain should
   * leave this method off.
   */
  verify?(opts: {
    readonly fromSeq?: number;
    readonly toSeq?: number;
  }): Promise<{ readonly ok: boolean; readonly count?: number; readonly brokenAt?: number }>;
}

const ISO_OR_EPOCH = z.union([z.coerce.number().int().nonnegative(), z.string().min(1)]);

const ListQuerySchema = z
  .object({
    limit: z.coerce.number().int().positive().max(1000).optional(),
    fromSeq: z.coerce.number().int().nonnegative().optional(),
    from: ISO_OR_EPOCH.optional(),
    to: ISO_OR_EPOCH.optional(),
    action: z.string().min(1).max(256).optional(),
  })
  .strict();

function parseTimestamp(input: unknown): number | undefined {
  if (input === undefined) return undefined;
  if (typeof input === 'number') return input;
  const parsed = Date.parse(String(input));
  return Number.isNaN(parsed) ? undefined : parsed;
}

const ExportBodySchema = z
  .object({
    fromSeq: z.number().int().nonnegative().optional(),
    toSeq: z.number().int().nonnegative().optional(),
    format: z.enum(['jsonl', 'csv']).optional(),
  })
  .strict()
  .default({});

/**
 * @stable
 */
export interface AuditRoutesDeps {
  readonly audit: AuditApi;
}

/**
 * @stable
 */
export function createAuditRoutes(deps: AuditRoutesDeps): Hono<{ Variables: ServerVariables }> {
  const app = new Hono<{ Variables: ServerVariables }>();

  app.get('/', createScopeMiddleware('audit:read'), async (c) => {
    const parsed = ListQuerySchema.safeParse({
      limit: c.req.query('limit'),
      fromSeq: c.req.query('fromSeq'),
      from: c.req.query('from'),
      to: c.req.query('to'),
      action: c.req.query('action'),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: 'config-invalid',
          message: 'Invalid audit query.',
          issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
        },
        400,
      );
    }
    const fromTs = parseTimestamp(parsed.data.from);
    const toTs = parseTimestamp(parsed.data.to);
    if (parsed.data.from !== undefined && fromTs === undefined) {
      return c.json(
        {
          error: 'config-invalid',
          message: `Invalid 'from' timestamp: '${String(parsed.data.from)}' is not parseable.`,
        },
        400,
      );
    }
    if (parsed.data.to !== undefined && toTs === undefined) {
      return c.json(
        {
          error: 'config-invalid',
          message: `Invalid 'to' timestamp: '${String(parsed.data.to)}' is not parseable.`,
        },
        400,
      );
    }
    const filters: {
      limit?: number;
      fromSeq?: number;
      fromTs?: number;
      toTs?: number;
      action?: string;
    } = {};
    if (parsed.data.limit !== undefined) filters.limit = parsed.data.limit;
    if (parsed.data.fromSeq !== undefined) filters.fromSeq = parsed.data.fromSeq;
    if (fromTs !== undefined) filters.fromTs = fromTs;
    if (toTs !== undefined) filters.toTs = toTs;
    if (parsed.data.action !== undefined) filters.action = parsed.data.action;
    const entries = await deps.audit.list(filters);
    return c.json({ entries });
  });

  app.post('/verify', createScopeMiddleware('audit:verify'), async (c) => {
    if (deps.audit.verify === undefined) {
      return c.json(
        {
          error: 'not-implemented',
          message: 'Audit chain verification is not enabled on this deployment.',
        },
        501,
      );
    }
    const parsed = ExportBodySchema.safeParse(await safelyParseJson(c));
    if (!parsed.success) {
      return c.json(
        {
          error: 'config-invalid',
          message: 'Invalid verify body.',
          issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
        },
        400,
      );
    }
    const opts: { fromSeq?: number; toSeq?: number } = {};
    if (parsed.data.fromSeq !== undefined) opts.fromSeq = parsed.data.fromSeq;
    if (parsed.data.toSeq !== undefined) opts.toSeq = parsed.data.toSeq;
    const result = await deps.audit.verify(opts);
    return c.json({ verify: result });
  });

  app.post('/export', createScopeMiddleware('audit:export'), async (c) => {
    const parsed = ExportBodySchema.safeParse(await safelyParseJson(c));
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
    const queryFormat = c.req.query('format');
    const requestedFormat =
      parsed.data.format ??
      (queryFormat === 'csv' ? 'csv' : queryFormat === 'jsonl' ? 'jsonl' : undefined);
    const opts: { fromSeq?: number; toSeq?: number; format?: 'jsonl' | 'csv' } = {};
    if (parsed.data.fromSeq !== undefined) opts.fromSeq = parsed.data.fromSeq;
    if (parsed.data.toSeq !== undefined) opts.toSeq = parsed.data.toSeq;
    if (requestedFormat !== undefined) opts.format = requestedFormat;
    const result = await deps.audit.export(opts);
    return c.json({ export: result });
  });

  return app;
}

async function safelyParseJson(c: Context<{ Variables: ServerVariables }>): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}
