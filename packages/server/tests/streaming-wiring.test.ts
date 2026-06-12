/**
 * IP-2 acceptance: POST /stream → subscribe to the subject from the
 * 202 → the agent's events arrive through the dispatcher and the run
 * reaches 'completed'. Workflow events are delivered on the (newly
 * grammatical) `workflow:<id>/runs/<runId>/events` subject.
 */

import type { ServerMessage } from '@graphorin/protocol';
import { parseScope } from '@graphorin/security/auth';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import type { ServerVariables } from '../src/internal/context.js';
import { AgentRegistry, WorkflowRegistry } from '../src/registry/index.js';
import { createAgentRoutes } from '../src/routes/agents.js';
import { createWorkflowRoutes } from '../src/routes/workflows.js';
import { RunStateTracker } from '../src/runtime/run-state.js';
import { createWsDispatcher } from '../src/ws/dispatcher.js';
import { tryParseSubject } from '../src/ws/subjects.js';

function makeSubscriber(scopes: string[]): {
  readonly handle: {
    readonly id: string;
    readonly tokenId: string;
    readonly grantedScopes: ReturnType<typeof parseScope>[];
    send: (frame: ServerMessage) => void;
    close: (code: number, reason: string) => void;
  };
  readonly sent: ServerMessage[];
} {
  const sent: ServerMessage[] = [];
  return {
    sent,
    handle: {
      id: 'sub-stream-1',
      tokenId: 'tok-1',
      grantedScopes: scopes.map((s) => parseScope(s)),
      send: (frame) => {
        sent.push(frame);
      },
      close: () => {},
    },
  };
}

function buildApp(): {
  readonly app: Hono<{ Variables: ServerVariables }>;
  readonly dispatcher: ReturnType<typeof createWsDispatcher>;
  readonly runs: RunStateTracker;
} {
  const dispatcher = createWsDispatcher();
  const runs = new RunStateTracker({ now: Date.now });
  const agents = new AgentRegistry();
  const workflows = new WorkflowRegistry();
  agents.register({
    id: 'streamy',
    agent: {
      id: 'streamy',
      async run() {
        return 'ran';
      },
      async *stream() {
        // Give the test a beat to subscribe before events flow.
        await new Promise((r) => setTimeout(r, 25));
        yield { type: 'text.delta', delta: 'hel' };
        yield { type: 'text.delta', delta: 'lo' };
        yield { type: 'agent.end', result: { status: 'completed', output: 'hello' } };
      },
    },
  });
  workflows.register({
    id: 'flowy',
    workflow: {
      id: 'flowy',
      async *execute() {
        await new Promise((r) => setTimeout(r, 25));
        yield { type: 'workflow.step.completed', stepNumber: 1 };
        yield { type: 'workflow.completed' };
      },
    } as never,
  });

  const app = new Hono<{ Variables: ServerVariables }>();
  app.use('*', async (c, next) => {
    c.set('state', {
      requestId: 'r',
      receivedAt: Date.now(),
      clientIp: '127.0.0.1',
      auth: {
        kind: 'token' as const,
        token: { tokenId: 'tok-1' } as never,
        grantedScopes: [
          parseScope('agents:invoke:streamy'),
          parseScope('agents:read:streamy'),
          parseScope('workflows:execute:flowy'),
          parseScope('workflows:read:flowy'),
        ],
      },
    } as never);
    await next();
  });
  app.route('/agents', createAgentRoutes({ agents, runs, dispatcher }));
  app.route('/workflows', createWorkflowRoutes({ workflows, runs, dispatcher }));
  return { app, dispatcher, runs };
}

describe('IP-2 — the streaming endpoints actually stream', () => {
  it('POST /agents/:id/stream emits the run events on the advertised subject and completes the run', async () => {
    const { app, dispatcher, runs } = buildApp();
    const res = await app.request('/agents/streamy/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'hi' }),
    });
    expect(res.status).toBe(202);
    const body = (await res.json()) as {
      runId: string;
      subscribe: { websocket: string };
    };
    // Subscribe to EXACTLY what the 202 advertised.
    const sub = makeSubscriber(['agents:read:streamy']);
    dispatcher.registerSubscriber(sub.handle);
    const result = dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: body.subscribe.websocket,
      subscriptionId: 'sub-a',
    });
    expect(result.ok).toBe(true);

    await new Promise((r) => setTimeout(r, 120));
    const types = sub.sent
      .filter((f) => (f as { kind?: string }).kind === 'event')
      .map(
        (f) => (f as { type?: string }).type ?? (f as { event?: { type?: string } }).event?.type,
      );
    expect(JSON.stringify(sub.sent)).toContain('text.delta');
    expect(JSON.stringify(sub.sent)).toContain('agent.end');
    expect(runs.snapshot(body.runId)?.status).toBe('completed');
    void types;
  });

  it('workflow events are delivered on the (now grammatical) workflow run subject', async () => {
    const { app, dispatcher, runs } = buildApp();
    const res = await app.request('/workflows/flowy/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: {} }),
    });
    expect(res.status).toBe(202);
    const body = (await res.json()) as {
      runId: string;
      subscribe: { websocket: string; sse?: string };
    };
    expect(body.subscribe.sse).toBeUndefined();
    // The advertised subject parses through the grammar (it did not before).
    const parsed = tryParseSubject(body.subscribe.websocket);
    expect(parsed.ok).toBe(true);

    const sub = makeSubscriber(['workflows:read:flowy']);
    dispatcher.registerSubscriber(sub.handle);
    const result = dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: body.subscribe.websocket,
      subscriptionId: 'sub-w',
    });
    expect(result.ok).toBe(true);

    await new Promise((r) => setTimeout(r, 120));
    expect(JSON.stringify(sub.sent)).toContain('workflow.step.completed');
    expect(runs.snapshot(body.runId)?.status).toBe('completed');
  });
});
