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

import { toWireAgentEvent } from '@graphorin/core';
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
  /**
   * Streaming dispatcher (IP-2). When present, `POST /:id/stream`
   * actually runs the agent and emits every event onto the
   * `agent:<id>/runs/<runId>/events` subject.
   */
  readonly dispatcher?: import('../ws/dispatcher.js').WsDispatcher;
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
      const input = parsed.success ? (parsed.data.input ?? '') : '';
      // IP-2: actually run the agent. The old handler parsed the input
      // and threw it away - the run sat 'pending' forever while the 202
      // advertised subjects nothing would ever emit on.
      const tracker = deps.runs.start(runId, {
        kind: 'agent',
        agentId: id,
        ...(sessionId !== undefined ? { sessionId } : {}),
        ...(userId !== undefined ? { userId } : {}),
      });
      const subject = `agent:${id}/runs/${runId}/events`;
      const agent = deps.agents.get(id);
      if (agent !== undefined) {
        backgroundStreamAgent(agent, input, {
          signal: tracker.signal,
          ...(sessionId !== undefined ? { sessionId } : {}),
          ...(userId !== undefined ? { userId } : {}),
          runs: deps.runs,
          runId,
          subject,
          ...(deps.dispatcher !== undefined ? { dispatcher: deps.dispatcher } : {}),
        });
      }
      return c.json(
        {
          runId,
          status: 'running',
          subscribe: {
            // The SSE URL previously advertised here pointed at a path
            // that was never mounted - the WebSocket subject is the
            // delivery channel (IP-2).
            websocket: subject,
          },
        },
        202,
      );
    },
  );

  return app;
}

/**
 * IP-2: consume the agent's event stream in the background and emit
 * every event onto the run subject. Falls back to `run(...)` (a single
 * terminal frame) for registry entries without a `stream` surface.
 */
function backgroundStreamAgent(
  agent: ReturnType<AgentRegistry['get']> & object,
  input: unknown,
  opts: {
    readonly signal: AbortSignal;
    readonly sessionId?: string;
    readonly userId?: string;
    readonly runs: RunStateTracker;
    readonly runId: string;
    readonly subject: string;
    readonly dispatcher?: import('../ws/dispatcher.js').WsDispatcher;
  },
): void {
  const emit = (type: string, payload: unknown): void => {
    opts.dispatcher?.emit(opts.subject, { type, payload });
  };
  void (async () => {
    try {
      const callOpts = {
        signal: opts.signal,
        ...(opts.sessionId !== undefined ? { sessionId: opts.sessionId } : {}),
        ...(opts.userId !== undefined ? { userId: opts.userId } : {}),
      };
      if (typeof agent.stream === 'function') {
        for await (const ev of agent.stream(input, callOpts)) {
          if (opts.signal.aborted) break;
          const type =
            typeof (ev as { type?: unknown }).type === 'string'
              ? (ev as { type: string }).type
              : 'agent.event';
          // W-046: binary-bearing variants (file.generated,
          // tool.execute.partial, agent.end with its full RunState) must
          // be projected to their JSON-safe wire twins before the
          // dispatcher stringifies the frame. Unknown types pass through.
          emit(type, toWireAgentEvent(ev as Parameters<typeof toWireAgentEvent>[0]));
        }
      } else {
        const output = await agent.run(input, callOpts);
        emit('agent.end', { runId: opts.runId, output });
      }
      opts.runs.complete(opts.runId, opts.signal.aborted ? 'aborted' : 'completed');
    } catch (err) {
      emit('agent.error', {
        runId: opts.runId,
        message: err instanceof Error ? err.message : String(err),
      });
      opts.runs.complete(opts.runId, opts.signal.aborted ? 'aborted' : 'failed', err);
    }
  })();
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
    // IP-14: a 202 that persists nothing and resumes nothing is a lie
    // the client SDK was built on. Until the server can rehydrate the
    // RunState and re-enter the agent loop (the persisted-approvals
    // work - Wave 3), the honest answer is 501 with the working
    // library-side path: `agent.run(result.state, { directive })`
    // executes approved tools for real (AG-1/AG-9).
    return c.json(
      {
        error: 'resume-not-implemented',
        runId,
        status: state.status,
        message:
          'Server-side HITL resume is not implemented yet. Resume library-side: ' +
          'agent.run(result.state, { directive }) - the suspended RunState is on the AgentResult.',
      },
      501,
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
