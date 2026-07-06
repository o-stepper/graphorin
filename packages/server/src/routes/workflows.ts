/**
 * Workflow REST routes.
 *
 *   POST   /workflows/:id/execute              (idempotent; scope `workflows:execute`)
 *   POST   /workflows/:id/resume               (scope `workflows:resume[:id]`;
 *                                               `name` targets an awakeable/approval, W-119)
 *   POST   /workflows/:id/retry                (scope `workflows:resume[:id]`, W-119)
 *   POST   /workflows/:id/tick                 (scope `workflows:resume[:id]`, W-119)
 *   GET    /workflows/:id/state                (scope `workflows:read`)
 *   GET    /workflows/:id/checkpoints          (scope `workflows:read`)
 *   POST   /workflows/:id/fork                 (scope `workflows:execute`; real fork, W-119)
 *   DELETE /workflows/:id/threads/:threadId    (scope `workflows:delete`)
 *
 * @packageDocumentation
 */

import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';

import { WorkflowNotFoundError } from '../errors/index.js';
import type { ServerVariables } from '../internal/context.js';
import { newRequestId } from '../internal/ids.js';
import { toWireError } from '../internal/wire-error.js';
import { createScopeMiddleware } from '../middleware/scope.js';
import type { WorkflowRegistry } from '../registry/index.js';
import type { RunStateTracker } from '../runtime/run-state.js';

/**
 * @stable
 */
export interface WorkflowRoutesDeps {
  readonly workflows: WorkflowRegistry;
  readonly runs: RunStateTracker;
  readonly newRunId?: () => string;
  /** Streaming dispatcher (IP-2): workflow events reach the run subject. */
  readonly dispatcher?: import('../ws/dispatcher.js').WsDispatcher;
}

const ExecuteBodySchema = z
  .object({
    input: z.unknown().optional(),
    threadId: z.string().min(1).optional(),
    sessionId: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
  })
  .strict()
  .default({});

const ResumeBodySchema = z
  .object({
    threadId: z.string().min(1),
    resume: z.unknown().optional(),
    /**
     * W-119: awakeable/approval name. When present the resume routes
     * through `resolveAwakeable(threadId, name, resume)` - `approve` is
     * the same primitive, no alias route needed.
     */
    name: z.string().min(1).optional(),
  })
  .strict();

const ThreadBodySchema = z
  .object({
    threadId: z.string().min(1),
  })
  .strict();

const ForkBodySchema = z
  .object({
    fromThreadId: z.string().min(1),
    fromCheckpointId: z.string().min(1).optional(),
  })
  .strict();

/**
 * @stable
 */
export function createWorkflowRoutes(
  deps: WorkflowRoutesDeps,
): Hono<{ Variables: ServerVariables }> {
  const app = new Hono<{ Variables: ServerVariables }>();
  const newRunId = deps.newRunId ?? newRequestId;

  app.get('/', createScopeMiddleware('workflows:read'), (c) =>
    c.json({ workflows: deps.workflows.list() }),
  );

  app.post(
    '/:id/execute',
    createScopeMiddleware((_path, params) => `workflows:execute:${params.id}`),
    async (c) => {
      const id = c.req.param('id');
      const workflow = deps.workflows.get(id);
      if (workflow === undefined) {
        const err = new WorkflowNotFoundError(id);
        return c.json({ error: err.kind, message: err.message }, 404);
      }
      const parsed = ExecuteBodySchema.safeParse(await safelyParseJson(c));
      if (!parsed.success) {
        return c.json(
          {
            error: 'config-invalid',
            message: 'Invalid execute body.',
            issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
          },
          400,
        );
      }
      const runId = newRunId();
      const tracker = deps.runs.start(runId, {
        kind: 'workflow',
        workflowId: id,
        ...(parsed.data.threadId !== undefined ? { threadId: parsed.data.threadId } : {}),
        ...(parsed.data.sessionId !== undefined ? { sessionId: parsed.data.sessionId } : {}),
        ...(parsed.data.userId !== undefined ? { userId: parsed.data.userId } : {}),
      });
      // Workflows are streaming-first; the REST endpoint kicks off the
      // run in the background and returns 202 + runId. The actual
      // event stream is consumed via WebSocket / SSE in Phase 14b.
      const subject = `workflow:${id}/runs/${runId}/events`;
      backgroundExecute(workflow, parsed.data, tracker, deps.runs, runId, {
        subject,
        ...(deps.dispatcher !== undefined ? { dispatcher: deps.dispatcher } : {}),
      });
      return c.json(
        {
          runId,
          status: 'running',
          subscribe: {
            // IP-2: the previously-advertised SSE URL was never
            // mounted; the WS subject (now in the grammar) delivers.
            websocket: subject,
          },
        },
        202,
      );
    },
  );

  app.post(
    '/:id/resume',
    createScopeMiddleware((_path, params) => `workflows:resume:${params.id}`),
    async (c) => {
      const id = c.req.param('id');
      const workflow = deps.workflows.get(id);
      if (workflow === undefined) {
        const err = new WorkflowNotFoundError(id);
        return c.json({ error: err.kind, message: err.message }, 404);
      }
      const parsed = ResumeBodySchema.safeParse(await safelyParseJson(c));
      if (!parsed.success) {
        return c.json(
          {
            error: 'config-invalid',
            message: 'Invalid resume body.',
            issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
          },
          400,
        );
      }
      if (parsed.data.name !== undefined && workflow.resolveAwakeable === undefined) {
        return c.json(
          {
            error: 'workflow-resume-unsupported',
            message: `Workflow '${id}' does not implement resolveAwakeable().`,
          },
          400,
        );
      }
      if (parsed.data.name === undefined && workflow.resume === undefined) {
        return c.json(
          {
            error: 'workflow-resume-unsupported',
            message: `Workflow '${id}' does not implement resume().`,
          },
          400,
        );
      }
      const runId = newRunId();
      // periphery-01: the old handler declared the run and returned 202
      // WITHOUT ever calling `workflow.resume(...)` - the run sat
      // `pending` forever and the advertised SSE URL was never mounted.
      // Resume now mirrors execute: background-iterate + emit on the WS
      // subject; the tracker completes the run.
      const tracker = deps.runs.start(runId, {
        kind: 'workflow',
        workflowId: id,
        threadId: parsed.data.threadId,
      });
      const subject = `workflow:${id}/runs/${runId}/events`;
      backgroundResume(workflow, parsed.data, tracker, deps.runs, runId, {
        subject,
        ...(deps.dispatcher !== undefined ? { dispatcher: deps.dispatcher } : {}),
      });
      return c.json(
        {
          runId,
          threadId: parsed.data.threadId,
          status: 'running',
          subscribe: {
            websocket: subject,
          },
        },
        202,
      );
    },
  );

  // W-119: replay a failed/aborted thread. Background-iterated like
  // resume; the run subject carries the events.
  app.post(
    '/:id/retry',
    createScopeMiddleware((_path, params) => `workflows:resume:${params.id}`),
    async (c) => {
      const id = c.req.param('id');
      const workflow = deps.workflows.get(id);
      if (workflow === undefined) {
        const err = new WorkflowNotFoundError(id);
        return c.json({ error: err.kind, message: err.message }, 404);
      }
      const parsed = ThreadBodySchema.safeParse(await safelyParseJson(c));
      if (!parsed.success) {
        return c.json(
          {
            error: 'config-invalid',
            message: 'Invalid retry body.',
            issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
          },
          400,
        );
      }
      if (workflow.retry === undefined) {
        return c.json(
          {
            error: 'workflow-retry-unsupported',
            message: `Workflow '${id}' does not implement retry().`,
          },
          400,
        );
      }
      const runId = newRunId();
      const tracker = deps.runs.start(runId, {
        kind: 'workflow',
        workflowId: id,
        threadId: parsed.data.threadId,
      });
      const subject = `workflow:${id}/runs/${runId}/events`;
      const retryFn = workflow.retry.bind(workflow);
      backgroundIterate(
        () => retryFn(parsed.data.threadId, { signal: tracker.signal }),
        tracker,
        deps.runs,
        runId,
        { subject, ...(deps.dispatcher !== undefined ? { dispatcher: deps.dispatcher } : {}) },
      );
      return c.json(
        {
          runId,
          threadId: parsed.data.threadId,
          status: 'running',
          subscribe: { websocket: subject },
        },
        202,
      );
    },
  );

  // W-119: fire a due durable timer synchronously. Long node bodies
  // hold the HTTP connection - documented; wire the timer daemon
  // (createServer({ workflowTimers })) for regular firing instead.
  app.post(
    '/:id/tick',
    createScopeMiddleware((_path, params) => `workflows:resume:${params.id}`),
    async (c) => {
      const id = c.req.param('id');
      const workflow = deps.workflows.get(id);
      if (workflow === undefined) {
        const err = new WorkflowNotFoundError(id);
        return c.json({ error: err.kind, message: err.message }, 404);
      }
      const parsed = ThreadBodySchema.safeParse(await safelyParseJson(c));
      if (!parsed.success) {
        return c.json(
          {
            error: 'config-invalid',
            message: 'Invalid tick body.',
            issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
          },
          400,
        );
      }
      if (workflow.tick === undefined) {
        return c.json(
          {
            error: 'workflow-tick-unsupported',
            message: `Workflow '${id}' does not implement tick().`,
          },
          400,
        );
      }
      try {
        const result = await workflow.tick(parsed.data.threadId);
        return c.json({
          workflowId: id,
          threadId: parsed.data.threadId,
          fired: result.fired,
          nextWakeAt: result.nextWakeAt,
        });
      } catch (err) {
        const wire = toWireError(err);
        return c.json(
          { error: wire.code, message: wire.message },
          wire.code === 'thread-not-found' ? 404 : 400,
        );
      }
    },
  );

  app.get(
    '/:id/state',
    createScopeMiddleware((_path, params) => `workflows:read:${params.id}`),
    async (c) => {
      const id = c.req.param('id');
      const workflow = deps.workflows.get(id);
      if (workflow === undefined) {
        const err = new WorkflowNotFoundError(id);
        return c.json({ error: err.kind, message: err.message }, 404);
      }
      const threadId = c.req.query('threadId');
      if (threadId === undefined || threadId.length === 0) {
        return c.json(
          { error: 'config-invalid', message: 'Query parameter `threadId` is required.' },
          400,
        );
      }
      if (workflow.getState === undefined) {
        return c.json(
          {
            error: 'workflow-state-unsupported',
            message: 'Workflow does not implement getState().',
          },
          400,
        );
      }
      const state = await workflow.getState(threadId);
      return c.json({ workflowId: id, threadId, state });
    },
  );

  app.get(
    '/:id/checkpoints',
    createScopeMiddleware((_path, params) => `workflows:read:${params.id}`),
    async (c) => {
      const id = c.req.param('id');
      const workflow = deps.workflows.get(id);
      if (workflow === undefined) {
        const err = new WorkflowNotFoundError(id);
        return c.json({ error: err.kind, message: err.message }, 404);
      }
      const threadId = c.req.query('threadId');
      if (threadId === undefined || threadId.length === 0) {
        return c.json(
          { error: 'config-invalid', message: 'Query parameter `threadId` is required.' },
          400,
        );
      }
      if (workflow.listCheckpoints === undefined) {
        return c.json(
          {
            error: 'workflow-checkpoints-unsupported',
            message: 'Workflow does not implement listCheckpoints().',
          },
          400,
        );
      }
      const checkpoints = await workflow.listCheckpoints(threadId);
      return c.json({ workflowId: id, threadId, checkpoints });
    },
  );

  // W-005: the reachable per-thread erasure lever. 204 on success (the
  // store delete is idempotent - deleting an unknown thread is a no-op),
  // 404 for an unknown workflow, 400 when the registered entry does not
  // expose deleteThread.
  app.delete(
    '/:id/threads/:threadId',
    createScopeMiddleware((_path, params) => `workflows:delete:${params.id}`),
    async (c) => {
      const id = c.req.param('id');
      const threadId = c.req.param('threadId');
      const workflow = deps.workflows.get(id);
      if (workflow === undefined) {
        const err = new WorkflowNotFoundError(id);
        return c.json({ error: err.kind, message: err.message }, 404);
      }
      if (workflow.deleteThread === undefined) {
        return c.json(
          {
            error: 'workflow-delete-thread-unsupported',
            message: 'Workflow does not implement deleteThread().',
          },
          400,
        );
      }
      await workflow.deleteThread(threadId);
      return c.body(null, 204);
    },
  );

  app.post(
    '/:id/fork',
    createScopeMiddleware((_path, params) => `workflows:execute:${params.id}`),
    async (c) => {
      const id = c.req.param('id');
      const workflow = deps.workflows.get(id);
      if (workflow === undefined) {
        const err = new WorkflowNotFoundError(id);
        return c.json({ error: err.kind, message: err.message }, 404);
      }
      const parsed = ForkBodySchema.safeParse(await safelyParseJson(c));
      if (!parsed.success) {
        return c.json(
          {
            error: 'config-invalid',
            message: 'Invalid fork body.',
            issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
          },
          400,
        );
      }
      // W-119: the fork primitive is now threaded through the registry -
      // the periphery-01 honest-501 kept its promise and retires here.
      if (workflow.fork === undefined) {
        return c.json(
          {
            error: 'workflow-fork-unsupported',
            message: `Workflow '${id}' does not implement fork().`,
          },
          400,
        );
      }
      try {
        let fromCheckpointId = parsed.data.fromCheckpointId;
        if (fromCheckpointId === undefined) {
          if (workflow.getState === undefined) {
            return c.json(
              {
                error: 'config-invalid',
                message:
                  'fromCheckpointId is required: this workflow does not expose getState() to derive the latest checkpoint.',
              },
              400,
            );
          }
          const state = (await workflow.getState(parsed.data.fromThreadId)) as {
            readonly checkpointId?: unknown;
          };
          if (typeof state?.checkpointId !== 'string') {
            return c.json(
              {
                error: 'checkpoint-not-found',
                message: `Thread '${parsed.data.fromThreadId}' has no checkpoint to fork from.`,
              },
              404,
            );
          }
          fromCheckpointId = state.checkpointId;
        }
        const forked = await workflow.fork(parsed.data.fromThreadId, fromCheckpointId);
        return c.json(
          {
            workflowId: id,
            fromThreadId: parsed.data.fromThreadId,
            fromCheckpointId,
            newThreadId: forked.newThreadId,
          },
          201,
        );
      } catch (err) {
        const wire = toWireError(err);
        return c.json(
          { error: wire.code, message: wire.message },
          wire.code === 'thread-not-found' || wire.code === 'checkpoint-not-found' ? 404 : 400,
        );
      }
    },
  );

  return app;
}

function backgroundExecute(
  workflow: NonNullable<ReturnType<WorkflowRegistry['get']>>,
  body: z.infer<typeof ExecuteBodySchema>,
  tracker: { readonly signal: AbortSignal },
  runs: RunStateTracker,
  runId: string,
  streaming: {
    readonly subject: string;
    readonly dispatcher?: import('../ws/dispatcher.js').WsDispatcher;
  },
): void {
  const opts: { signal?: AbortSignal; threadId?: string } = { signal: tracker.signal };
  if (body.threadId !== undefined) opts.threadId = body.threadId;
  void (async () => {
    try {
      // IP-2: every workflow event reaches the dispatcher - the old
      // loop iterated the stream and threw each event away.
      for await (const ev of workflow.execute(body.input ?? {}, opts)) {
        if (tracker.signal.aborted) break;
        const type =
          typeof (ev as { type?: unknown }).type === 'string'
            ? (ev as { type: string }).type
            : 'workflow.event';
        streaming.dispatcher?.emit(streaming.subject, { type, payload: ev });
      }
      runs.complete(runId, tracker.signal.aborted ? 'aborted' : 'completed');
    } catch (err) {
      // W-052: the frame carries the normalized machine-readable code
      // next to the unchanged message, so clients can retry
      // `checkpoint-version-conflict` and abandon
      // `node-execution-failed` without parsing prose.
      streaming.dispatcher?.emit(streaming.subject, {
        type: 'workflow.error',
        payload: { runId, ...toWireError(err) },
      });
      runs.complete(runId, tracker.signal.aborted ? 'aborted' : 'failed', err);
    }
  })();
}

/**
 * periphery-01 / W-119: mirror of {@link backgroundExecute} for the
 * resume path. A `name` in the body routes through
 * `resolveAwakeable(threadId, name, resume)`; a plain resume goes
 * through `resume(threadId, {resume})`. Both receive the tracker's
 * AbortSignal so `runs.abort(runId)` actually cancels the iteration
 * (parity with backgroundExecute - the old path dropped it).
 */
function backgroundResume(
  workflow: NonNullable<ReturnType<WorkflowRegistry['get']>>,
  body: z.infer<typeof ResumeBodySchema>,
  tracker: { readonly signal: AbortSignal },
  runs: RunStateTracker,
  runId: string,
  streaming: {
    readonly subject: string;
    readonly dispatcher?: import('../ws/dispatcher.js').WsDispatcher;
  },
): void {
  const { resume, resolveAwakeable } = workflow;
  const name = body.name;
  const factory =
    name !== undefined && resolveAwakeable !== undefined
      ? () =>
          resolveAwakeable.call(workflow, body.threadId, name, body.resume, {
            signal: tracker.signal,
          })
      : resume !== undefined
        ? () =>
            resume.call(
              workflow,
              body.threadId,
              body.resume !== undefined ? { resume: body.resume } : {},
              { signal: tracker.signal },
            )
        : undefined;
  if (factory === undefined) return;
  backgroundIterate(factory, tracker, runs, runId, streaming);
}

/**
 * W-119: shared background iteration for resume / named resume / retry -
 * emit every event on the run subject, complete the tracked run, wrap
 * failures in the W-052 wire envelope.
 */
function backgroundIterate(
  factory: () => AsyncIterable<unknown>,
  tracker: { readonly signal: AbortSignal },
  runs: RunStateTracker,
  runId: string,
  streaming: {
    readonly subject: string;
    readonly dispatcher?: import('../ws/dispatcher.js').WsDispatcher;
  },
): void {
  void (async () => {
    try {
      for await (const ev of factory()) {
        if (tracker.signal.aborted) break;
        const type =
          typeof (ev as { type?: unknown }).type === 'string'
            ? (ev as { type: string }).type
            : 'workflow.event';
        streaming.dispatcher?.emit(streaming.subject, { type, payload: ev });
      }
      runs.complete(runId, tracker.signal.aborted ? 'aborted' : 'completed');
    } catch (err) {
      // W-052: same envelope as the execute path.
      streaming.dispatcher?.emit(streaming.subject, {
        type: 'workflow.error',
        payload: { runId, ...toWireError(err) },
      });
      runs.complete(runId, tracker.signal.aborted ? 'aborted' : 'failed', err);
    }
  })();
}

async function safelyParseJson(c: Context<{ Variables: ServerVariables }>): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}
