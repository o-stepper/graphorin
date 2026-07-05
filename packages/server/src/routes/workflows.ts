/**
 * Workflow REST routes.
 *
 *   POST   /workflows/:id/execute              (idempotent; scope `workflows:execute`)
 *   POST   /workflows/:id/resume               (scope `workflows:resume[:id]`)
 *   GET    /workflows/:id/state                (scope `workflows:read`)
 *   GET    /workflows/:id/checkpoints          (scope `workflows:read`)
 *   POST   /workflows/:id/fork                 (scope `workflows:execute`)
 *
 * @packageDocumentation
 */

import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';

import { WorkflowNotFoundError } from '../errors/index.js';
import type { ServerVariables } from '../internal/context.js';
import { newRequestId } from '../internal/ids.js';
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
      if (workflow.resume === undefined) {
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
      // periphery-01: the old handler returned a 202 that forked
      // nothing - the same class of lie IP-14 removed from the agent
      // resume route. Honest 501 until the workflow fork primitive is
      // threaded through the registry.
      return c.json(
        {
          error: 'workflow-fork-not-implemented',
          message:
            'Workflow fork is not implemented on the server surface yet. ' +
            'Fork the thread programmatically via the workflow API.',
          workflowId: id,
          fork: parsed.data,
        },
        501,
      );
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
      streaming.dispatcher?.emit(streaming.subject, {
        type: 'workflow.error',
        payload: { runId, message: err instanceof Error ? err.message : String(err) },
      });
      runs.complete(runId, tracker.signal.aborted ? 'aborted' : 'failed', err);
    }
  })();
}

/**
 * periphery-01: mirror of {@link backgroundExecute} for the resume
 * path - iterate `workflow.resume(threadId, {resume})`, emit every
 * event on the run subject, and complete the tracked run.
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
  const resume = workflow.resume;
  if (resume === undefined) return;
  void (async () => {
    try {
      for await (const ev of resume.call(
        workflow,
        body.threadId,
        body.resume !== undefined ? { resume: body.resume } : {},
      )) {
        if (tracker.signal.aborted) break;
        const type =
          typeof (ev as { type?: unknown }).type === 'string'
            ? (ev as { type: string }).type
            : 'workflow.event';
        streaming.dispatcher?.emit(streaming.subject, { type, payload: ev });
      }
      runs.complete(runId, tracker.signal.aborted ? 'aborted' : 'completed');
    } catch (err) {
      streaming.dispatcher?.emit(streaming.subject, {
        type: 'workflow.error',
        payload: { runId, message: err instanceof Error ? err.message : String(err) },
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
