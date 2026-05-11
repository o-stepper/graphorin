/**
 * Memory REST routes. The handlers delegate to a structurally-typed
 * `MemoryApi` provided by the operator (in practice, a thin shim
 * around `@graphorin/memory.createMemory({...})`).
 *
 *   POST   /memory/search              (scope `memory:read`)
 *   POST   /memory/facts               (idempotent; scope `memory:write`)
 *   DELETE /memory/facts/:id           (scope `memory:write`)
 *   POST   /memory/blocks              (idempotent; scope `memory:write`)
 *   DELETE /memory/blocks/:label       (scope `memory:write`)
 *
 * @packageDocumentation
 */

import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';

import type { ServerVariables } from '../internal/context.js';
import { createScopeMiddleware } from '../middleware/scope.js';

const ScopeSchema = z
  .object({
    userId: z.string().min(1),
    agentId: z.string().min(1).optional(),
    sessionId: z.string().min(1).optional(),
  })
  .strict();

const SearchBodySchema = z
  .object({
    scope: ScopeSchema,
    query: z.string().min(1),
    topK: z.number().int().positive().max(200).optional(),
  })
  .strict();

const RememberBodySchema = z
  .object({
    scope: ScopeSchema,
    text: z.string().min(1),
    sensitivity: z.enum(['public', 'internal', 'secret']).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

const BlockBodySchema = z
  .object({
    scope: ScopeSchema,
    label: z.string().min(1),
    body: z.string(),
  })
  .strict();

/**
 * @stable
 */
export interface MemoryApi {
  search(input: z.infer<typeof SearchBodySchema>): Promise<ReadonlyArray<unknown>>;
  remember(input: z.infer<typeof RememberBodySchema>): Promise<{ readonly factId: string }>;
  forget(scope: { readonly userId: string }, factId: string): Promise<boolean>;
  upsertBlock(input: z.infer<typeof BlockBodySchema>): Promise<{ readonly label: string }>;
  deleteBlock(scope: { readonly userId: string }, label: string): Promise<boolean>;
}

/**
 * @stable
 */
export interface MemoryRoutesDeps {
  readonly memory: MemoryApi;
}

/**
 * @stable
 */
export function createMemoryRoutes(deps: MemoryRoutesDeps): Hono<{ Variables: ServerVariables }> {
  const app = new Hono<{ Variables: ServerVariables }>();

  app.post('/search', createScopeMiddleware('memory:read'), async (c) => {
    const parsed = SearchBodySchema.safeParse(await safelyParseJson(c));
    if (!parsed.success) {
      return invalid(c, parsed.error.issues);
    }
    const hits = await deps.memory.search(parsed.data);
    return c.json({ hits });
  });

  app.post('/facts', createScopeMiddleware('memory:write'), async (c) => {
    const parsed = RememberBodySchema.safeParse(await safelyParseJson(c));
    if (!parsed.success) return invalid(c, parsed.error.issues);
    const out = await deps.memory.remember(parsed.data);
    return c.json({ fact: out }, 201);
  });

  app.delete('/facts/:id', createScopeMiddleware('memory:write'), async (c) => {
    const id = c.req.param('id');
    const userId = c.req.query('userId');
    if (userId === undefined || userId.length === 0) {
      return c.json(
        { error: 'config-invalid', message: 'Query parameter `userId` is required.' },
        400,
      );
    }
    const removed = await deps.memory.forget({ userId }, id);
    if (!removed)
      return c.json({ error: 'fact-not-found', message: `Fact '${id}' not found.` }, 404);
    return c.body(null, 204);
  });

  app.post('/blocks', createScopeMiddleware('memory:write'), async (c) => {
    const parsed = BlockBodySchema.safeParse(await safelyParseJson(c));
    if (!parsed.success) return invalid(c, parsed.error.issues);
    const out = await deps.memory.upsertBlock(parsed.data);
    return c.json({ block: out }, 201);
  });

  app.delete('/blocks/:label', createScopeMiddleware('memory:write'), async (c) => {
    const label = c.req.param('label');
    const userId = c.req.query('userId');
    if (userId === undefined || userId.length === 0) {
      return c.json(
        { error: 'config-invalid', message: 'Query parameter `userId` is required.' },
        400,
      );
    }
    const removed = await deps.memory.deleteBlock({ userId }, label);
    if (!removed)
      return c.json({ error: 'block-not-found', message: `Block '${label}' not found.` }, 404);
    return c.body(null, 204);
  });

  return app;
}

function invalid(c: Context<{ Variables: ServerVariables }>, issues: ReadonlyArray<z.ZodIssue>) {
  return c.json(
    {
      error: 'config-invalid',
      message: 'Invalid request body.',
      issues: issues.map((i) => ({ path: i.path, message: i.message })),
    },
    400,
  );
}

async function safelyParseJson(c: Context<{ Variables: ServerVariables }>): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}
