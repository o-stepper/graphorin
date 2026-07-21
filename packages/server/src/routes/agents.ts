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
import { INVALID_JSON_BODY, readJsonBody } from '../internal/json.js';
import {
  checkScope,
  createAuthenticatedMiddleware,
  createScopeMiddleware,
} from '../middleware/scope.js';
import type { AgentRegistry } from '../registry/index.js';
import { type RunStateTracker, requiredRunScope } from '../runtime/run-state.js';

/**
 * @stable
 */
export interface AgentRoutesDeps {
  readonly agents: AgentRegistry;
  readonly runs: RunStateTracker;
  readonly newRunId?: () => string;
  /**
   * Streaming dispatcher. When present, `POST /:id/stream`
   * actually runs the agent and emits every event onto the
   * `agent:<id>/runs/<runId>/events` subject.
   */
  readonly dispatcher?: import('../ws/dispatcher.js').WsDispatcher;
  /**
   * Durable suspended-run sidecar (migration 038). Writes flow through
   * the tracker's persistence hooks; the route layer only needs the
   * explicit DELETE on `POST /runs/:runId/abort` - the tracker's
   * `abort()` deliberately keeps rows so a graceful-shutdown
   * force-abort cannot erase parked approvals.
   */
  readonly suspendedRuns?: { delete(runId: string): Promise<void> };
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
      const raw = await readJsonBody(c);
      if (raw === INVALID_JSON_BODY) {
        return c.json({ error: 'invalid-json', message: 'Request body is not valid JSON.' }, 400);
      }
      const parsed = RunBodySchema.safeParse(raw);
      if (!parsed.success) {
        return invalidBodyResponse(c, parsed.error);
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
        // C3/W-119: a durable-HITL suspension is not terminal - retain
        // the resumable RunState so POST /runs/:runId/resume can
        // re-enter the loop in-process.
        if (isSuspendedAgentResult(result)) {
          deps.runs.suspend(runId, result.state);
          return c.json({ runId, status: 'awaiting_approval', result }, 200);
        }
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
      // W-151: validate the body BEFORE any run is registered - the old
      // handler swallowed a failed parse and launched the agent on an
      // empty prompt, burning provider tokens behind a 202 that looked
      // successful. Identical validation to the sibling /run route
      // (empty/absent bodies stay valid via the schema default).
      const raw = await readJsonBody(c);
      if (raw === INVALID_JSON_BODY) {
        return c.json({ error: 'invalid-json', message: 'Request body is not valid JSON.' }, 400);
      }
      const parsed = RunBodySchema.safeParse(raw);
      if (!parsed.success) {
        return invalidBodyResponse(c, parsed.error);
      }
      const runId = newRunId();
      const sessionId = parsed.data.sessionId;
      const userId = parsed.data.userId;
      const input = parsed.data.input ?? '';
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
 * Consume the agent's event stream in the background and emit
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

  // W-107: run control binds to the run's OWNING resource. The
  // requirement is only known after the snapshot resolves the
  // descriptor, so the outer gate is authentication-only and the
  // handlers authorize imperatively: 404 for unknown runs first
  // (runIds are unguessable newRequestId values and ephemeral - the
  // ordering is deliberate and matches WS run.cancel), then 403 when
  // the grant does not cover the owning agent/workflow. Bare
  // `agents:read`/`agents:invoke` grants keep covering their
  // per-resource requirements.
  app.get('/:runId/state', createAuthenticatedMiddleware(), (c) => {
    const runId = c.req.param('runId');
    const state = deps.runs.snapshot(runId);
    if (state === undefined) {
      return c.json({ error: 'run-not-found', message: `Run '${runId}' is not registered.` }, 404);
    }
    const required = requiredRunScope(state, 'read');
    if (!checkScope(c.get('state').auth, required)) {
      return c.json(
        { error: 'scope-denied', message: `Token lacks required scope '${required}'.` },
        403,
      );
    }
    return c.json(state);
  });

  app.post('/:runId/abort', createAuthenticatedMiddleware(), async (c) => {
    const runId = c.req.param('runId');
    const state = deps.runs.snapshot(runId);
    if (state === undefined) {
      return c.json({ error: 'run-not-found', message: `Run '${runId}' is not registered.` }, 404);
    }
    const required = requiredRunScope(state, 'control');
    if (!checkScope(c.get('state').auth, required)) {
      return c.json(
        { error: 'scope-denied', message: `Token lacks required scope '${required}'.` },
        403,
      );
    }
    const aborted = deps.runs.abort(runId);
    if (!aborted) {
      return c.json({ error: 'run-not-found', message: `Run '${runId}' is not registered.` }, 404);
    }
    if (state.status === 'awaiting_approval' && deps.suspendedRuns !== undefined) {
      // An explicit user abort settles the park for good - drop the
      // durable row (the tracker's abort() keeps rows by design so the
      // shutdown force-abort cannot erase restart-surviving parks).
      await deps.suspendedRuns.delete(runId).catch(() => {});
    }
    return c.json({ runId, status: 'aborted' });
  });

  // C3/W-119: the formerly-501 endpoint. Resumes a suspended agent
  // run: the tracker retained the resumable RunState when the run
  // parked (POST /agents/:id/run suspension branch, or
  // `runs.registerSuspended(...)` for proactive fires executed outside
  // the REST surface), and the directive's approval decisions re-enter
  // the agent loop via `agent.run(state, { directive })`. Since
  // migration 038 a park also survives a process RESTART: boot
  // hydration re-registers each durable row with its serialized-state
  // string, which this handler rehydrates through the agent's codec.
  app.post('/:runId/resume', createAuthenticatedMiddleware(), async (c) => {
    const runId = c.req.param('runId');
    const state = deps.runs.snapshot(runId);
    if (state === undefined) {
      return c.json({ error: 'run-not-found', message: `Run '${runId}' is not registered.` }, 404);
    }
    const requiredResume = requiredRunScope(state, 'control');
    if (!checkScope(c.get('state').auth, requiredResume)) {
      return c.json(
        { error: 'scope-denied', message: `Token lacks required scope '${requiredResume}'.` },
        403,
      );
    }
    if (state.status !== 'awaiting_approval') {
      return c.json(
        {
          error: 'run-not-suspended',
          runId,
          status: state.status,
          message: `Run '${runId}' is '${state.status}', not 'awaiting_approval' - nothing to resume.`,
        },
        409,
      );
    }
    let suspended = deps.runs.suspendedStateOf(runId);
    if (suspended === undefined) {
      return c.json(
        {
          error: 'run-state-unavailable',
          runId,
          message:
            `Run '${runId}' is suspended but its RunState is not retained by this process. ` +
            'Resume library-side: agent.run(savedState, { directive }).',
        },
        409,
      );
    }
    const agentId = state.agentId;
    const agent = agentId !== undefined ? deps.agents.get(agentId) : undefined;
    if (agent === undefined) {
      return c.json(
        {
          error: 'agent-not-found',
          runId,
          message: `Agent '${agentId ?? '?'}' behind run '${runId}' is not registered.`,
        },
        404,
      );
    }
    // Migration 038: a string state is a boot-hydrated durable row -
    // rehydrate it through the owning agent's codec before re-entering
    // the loop (the codec restores binary payloads the wire form
    // envelopes; a naive JSON.parse would smuggle them through).
    if (typeof suspended === 'string') {
      if (typeof agent.deserializeState !== 'function') {
        return c.json(
          {
            error: 'run-state-unavailable',
            runId,
            message:
              `Run '${runId}' was restored from durable storage but agent '${agentId}' ` +
              'exposes no deserializeState codec - resume library-side: ' +
              'agent.run(savedState, { directive }).',
          },
          409,
        );
      }
      try {
        suspended = agent.deserializeState(suspended);
      } catch (err) {
        return c.json(
          {
            error: 'run-state-invalid',
            runId,
            message:
              `Run '${runId}' has a durable suspended state this build cannot rehydrate: ` +
              `${err instanceof Error ? err.message : String(err)}`,
          },
          500,
        );
      }
    }
    const raw = await readJsonBody(c);
    if (raw === INVALID_JSON_BODY) {
      return c.json({ error: 'invalid-json', message: 'Request body is not valid JSON.' }, 400);
    }
    const parsed = ResumeRunBodySchema.safeParse(raw);
    if (!parsed.success) {
      return invalidBodyResponse(c, parsed.error);
    }
    // exactOptionalPropertyTypes: zod's `.optional()` yields
    // `string | undefined`; the structural directive wants the field
    // absent instead.
    const approvals = parsed.data.approvals.map((a) => ({
      toolCallId: a.toolCallId,
      granted: a.granted,
      ...(a.reason !== undefined ? { reason: a.reason } : {}),
      ...(a.subRunToolCallId !== undefined ? { subRunToolCallId: a.subRunToolCallId } : {}),
    }));
    const tracker = deps.runs.start(runId, {
      kind: 'agent',
      agentId: agentId as string,
      ...(state.sessionId !== undefined ? { sessionId: state.sessionId } : {}),
      ...(state.userId !== undefined ? { userId: state.userId } : {}),
    });
    try {
      const result = await agent.run(suspended, {
        signal: tracker.signal,
        ...(state.sessionId !== undefined ? { sessionId: state.sessionId } : {}),
        ...(state.userId !== undefined ? { userId: state.userId } : {}),
        directive: { approvals },
      });
      // A partially-resolved directive re-suspends: retain the fresh
      // state so the next resume call picks up where this one left off.
      if (isSuspendedAgentResult(result)) {
        deps.runs.suspend(runId, result.state);
        return c.json({ runId, status: 'awaiting_approval', result }, 200);
      }
      deps.runs.complete(runId, 'completed');
      return c.json({ runId, status: 'completed', result }, 200);
    } catch (err) {
      if (err instanceof Error && err.name === 'ConcurrentRunError') {
        // The agent instance is busy with another run - the suspension
        // is untouched; retry later.
        deps.runs.suspend(runId, suspended);
        return c.json({ error: 'agent-busy', runId, message: err.message }, 409);
      }
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
  });

  return app;
}

const ResumeRunBodySchema = z
  .object({
    approvals: z
      .array(
        z
          .object({
            toolCallId: z.string().min(1),
            granted: z.boolean(),
            reason: z.string().optional(),
            subRunToolCallId: z.string().min(1).optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

/**
 * Structural probe for a suspended `AgentResult` (`status:
 * 'awaiting_approval'` with a resumable `state`). Structural because
 * registry agents are `ServerAgentLike` - the server never imports the
 * agent package's types.
 */
function isSuspendedAgentResult(value: unknown): value is { readonly state: unknown } {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as { readonly status?: unknown; readonly state?: unknown };
  return record.status === 'awaiting_approval' && typeof record.state === 'object';
}

/**
 * Byte-identical 400 for an invalid run/stream body - both
 * sibling routes validate through this one helper.
 */
function invalidBodyResponse(
  c: Context<{ Variables: ServerVariables }>,
  error: { issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }> },
) {
  return c.json(
    {
      error: 'config-invalid',
      message: 'Invalid run body.',
      issues: error.issues.map((i) => ({ path: i.path, message: i.message })),
    },
    400,
  );
}
