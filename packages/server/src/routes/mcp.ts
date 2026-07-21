/**
 * MCP server-management REST routes.
 *
 *   GET    /mcp/servers                (scope `mcp:admin`)
 *   POST   /mcp/servers                (idempotent; scope `mcp:admin`)
 *   DELETE /mcp/servers/:id            (scope `mcp:admin`)
 *
 * @packageDocumentation
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { ServerVariables } from '../internal/context.js';
import { INVALID_JSON_BODY, readJsonBody } from '../internal/json.js';
import { createScopeMiddleware } from '../middleware/scope.js';

/**
 * @stable
 */
export interface McpApi {
  list(): Promise<ReadonlyArray<unknown>>;
  register(input: {
    readonly id: string;
    readonly transport: string;
    readonly url?: string;
  }): Promise<unknown>;
  remove(id: string): Promise<boolean>;
}

const RegisterBodySchema = z
  .object({
    id: z.string().min(1),
    transport: z.enum(['stdio', 'streamable-http', 'sse']),
    url: z.string().min(1).optional(),
  })
  .strict();

/**
 * @stable
 */
export interface McpRoutesDeps {
  readonly mcp: McpApi;
}

/**
 * @stable
 */
export function createMcpRoutes(deps: McpRoutesDeps): Hono<{ Variables: ServerVariables }> {
  const app = new Hono<{ Variables: ServerVariables }>();

  app.get('/servers', createScopeMiddleware('mcp:admin'), async (c) => {
    return c.json({ servers: await deps.mcp.list() });
  });

  app.post('/servers', createScopeMiddleware('mcp:admin'), async (c) => {
    const raw = await readJsonBody(c);
    if (raw === INVALID_JSON_BODY) {
      return c.json({ error: 'invalid-json', message: 'Request body is not valid JSON.' }, 400);
    }
    const parsed = RegisterBodySchema.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        {
          error: 'config-invalid',
          message: 'Invalid MCP server body.',
          issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
        },
        400,
      );
    }
    const payload: { id: string; transport: string; url?: string } = {
      id: parsed.data.id,
      transport: parsed.data.transport,
    };
    if (parsed.data.url !== undefined) payload.url = parsed.data.url;
    const out = await deps.mcp.register(payload);
    return c.json({ server: out }, 201);
  });

  app.delete('/servers/:id', createScopeMiddleware('mcp:admin'), async (c) => {
    const id = c.req.param('id');
    const removed = await deps.mcp.remove(id);
    if (!removed)
      return c.json(
        { error: 'mcp-server-not-found', message: `MCP server '${id}' not found.` },
        404,
      );
    return c.body(null, 204);
  });

  return app;
}
