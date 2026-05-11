/**
 * Agent REST routes.
 *
 *   GET    /agents                       (scope `agents:read`)
 *   GET    /agents/:id                   (scope `agents:read`)
 *   POST   /agents/:id/run               (idempotent; scope `agents:invoke[:id]`)
 *   POST   /agents/:id/stream            (scope `agents:invoke[:id]`)
 *   GET    /runs/:runId/state            (scope `agents:read`)
 *   POST   /runs/:runId/abort            (scope `agents:invoke`)
 *   POST   /runs/:runId/resume           (idempotent; scope `agents:invoke`)
 *
 * Agents are looked up via {@link AgentRegistry}; missing entries
 * surface a 404 with a typed error body.
 *
 * @packageDocumentation
 */

import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';
import { AgentNotFoundError } from '../errors/index.js';
import type { ServerVariables } from '../internal/context.js';
import { newRequestId } from '../internal/ids.js';
import { createScopeMiddleware } from '../middleware/scope.js';
import type { AgentRegistry } from '../registry/index.js';
import type { RunStateTracker } from '../runtime/run-state.js';

/**
 * @stable
 */
export interface AgentRoutesDeps {
  readonly agents: AgentRegistry;
  readonly runs: RunStateTracker;
  readonly newRunId?: () => string;
}

const RunBodySchema = z
  .object({
    input: z.unknown().optional(),
    sessionId: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
  })
  .strict()
  .default({});

/**
 * @stable
 */
export function createAgentRoutes(deps: AgentRoutesDeps): Hono<{ Variables: ServerVariables }> {
  const app = new Hono<{ Variables: ServerVariables }>();
  const newRunId = deps.newRunId ?? newRequestId;

  app.get('/', createScopeMiddleware('agents:read'), (c) => c.json({ agents: deps.agents.list() }));

  app.get(
    '/:id',
    createScopeMiddleware((_path, params) => `agents:read:${params.id}`),
    (c) => {
      const id = c.req.param('id');
      const summary = deps.agents.describe(id);
      if (summary === undefined) {
        return c.json(
          { error: 'agent-not-found', message: `Agent '${id}' is not registered.` },
          404,
        );
      }
      return c.json(summary);
    },
  );

  app.post(
    '/:id/run',
    createScopeMiddleware((_path, params) => `agents:invoke:${params.id}`),
    async (c) => {
      const id = c.req.param('id');
      const agent = deps.agents.get(id);
      if (agent === undefined) {
        const err = new AgentNotFoundError(id);
        return c.json({ error: err.kind, message: err.message }, 404);
      }
      const parsed = RunBodySchema.safeParse(await safelyParseJson(c));
      if (!parsed.success) {
        return c.json(
          {
            error: 'config-invalid',
            message: 'Invalid run body.',
            issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
          },
          400,
        );
      }
      const runId = newRunId();
      const sessionId = parsed.data.sessionId;
      const userId = parsed.data.userId;
      const tracker = deps.runs.start(runId, {
        kind: 'agent',
        agentId: id,
        ...(sessionId !== undefined ? { sessionId } : {}),
        ...(userId !== undefined ? { userId } : {}),
      });
      try {
        const callOptions: { signal?: AbortSignal; sessionId?: string; userId?: string } = {
          signal: tracker.signal,
        };
        if (sessionId !== undefined) callOptions.sessionId = sessionId;
        if (userId !== undefined) callOptions.userId = userId;
        const result = await agent.run(parsed.data.input ?? '', callOptions);
        deps.runs.complete(runId, 'completed');
        return c.json({ runId, status: 'completed', result }, 200);
      } catch (err) {
        const aborted = tracker.signal.aborted;
        deps.runs.complete(runId, aborted ? 'aborted' : 'failed', err);
        return c.json(
          {
            runId,
            status: aborted ? 'aborted' : 'failed',
            error: aborted ? 'run-aborted' : 'run-failed',
            message: err instanceof Error ? err.message : String(err),
          },
          aborted ? 408 : 500,
        );
      }
    },
  );

  app.post(
    '/:id/stream',
    createScopeMiddleware((_path, params) => `agents:invoke:${params.id}`),
    async (c) => {
      const id = c.req.param('id');
      if (!deps.agents.has(id)) {
        const err = new AgentNotFoundError(id);
        return c.json({ error: err.kind, message: err.message }, 404);
      }
      const runId = newRunId();
      const parsed = RunBodySchema.safeParse(await safelyParseJson(c));
      const sessionId = parsed.success ? parsed.data.sessionId : undefined;
      const userId = parsed.success ? parsed.data.userId : undefined;
      deps.runs.declare(runId, {
        kind: 'agent',
        agentId: id,
        ...(sessionId !== undefined ? { sessionId } : {}),
        ...(userId !== undefined ? { userId } : {}),
      });
      // Per ADR-031, the actual event stream is delivered via WebSocket
      // (Phase 14b) or SSE. The REST endpoint returns a 202 with the
      // run id so callers can subscribe to the streaming channel.
      return c.json(
        {
          runId,
          status: 'pending',
          subscribe: {
            websocket: `agent:${id}/runs/${runId}/events`,
            sse: `/v1/runs/${runId}/events`,
          },
        },
        202,
      );
    },
  );

  return app;
}

/**
 * Companion router for the `/runs/...` surface. Kept separate so the
 * `createServer` factory can mount it under the top-level base path
 * rather than under `/agents`.
 *
 * @stable
 */
export function createRunRoutes(deps: AgentRoutesDeps): Hono<{ Variables: ServerVariables }> {
  const app = new Hono<{ Variables: ServerVariables }>();

  app.get('/:runId/state', createScopeMiddleware('agents:read'), (c) => {
    const runId = c.req.param('runId');
    const state = deps.runs.snapshot(runId);
    if (state === undefined) {
      return c.json({ error: 'run-not-found', message: `Run '${runId}' is not registered.` }, 404);
    }
    return c.json(state);
  });

  app.post('/:runId/abort', createScopeMiddleware('agents:invoke'), (c) => {
    const runId = c.req.param('runId');
    const aborted = deps.runs.abort(runId);
    if (!aborted) {
      return c.json({ error: 'run-not-found', message: `Run '${runId}' is not registered.` }, 404);
    }
    return c.json({ runId, status: 'aborted' });
  });

  app.post('/:runId/resume', createScopeMiddleware('agents:invoke'), async (c) => {
    const runId = c.req.param('runId');
    const state = deps.runs.snapshot(runId);
    if (state === undefined) {
      return c.json({ error: 'run-not-found', message: `Run '${runId}' is not registered.` }, 404);
    }
    // Phase 14a stub: full HITL resume wiring lives in Phase 14b/c.
    // The endpoint accepts the directive payload, persists nothing,
    // and returns the current snapshot so clients can verify the
    // contract surface today.
    return c.json(
      { runId, status: state.status, message: 'Resume accepted; awaiting HITL implementation.' },
      202,
    );
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
