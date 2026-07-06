/**
 * IP-2 acceptance: POST /stream → subscribe to the subject from the
 * 202 → the agent's events arrive through the dispatcher and the run
 * reaches 'completed'. Workflow events are delivered on the (newly
 * grammatical) `workflow:<id>/runs/<runId>/events` subject.
 */

import { fromWireAgentEvent } from '@graphorin/core';
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
  agents.register({
    id: 'binary',
    agent: {
      id: 'binary',
      async run() {
        return 'ran';
      },
      // W-046 fixture: binary-bearing events that plain JSON.stringify
      // would corrupt - the route must project them to wire form.
      async *stream() {
        await new Promise((r) => setTimeout(r, 25));
        yield {
          type: 'file.generated',
          mimeType: 'image/png',
          data: new Uint8Array([137, 80, 78, 71]),
        };
        yield {
          type: 'agent.end',
          result: {
            status: 'completed',
            output: 'done',
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            state: {
              id: 'run-b',
              agentId: 'binary',
              currentAgentId: 'binary',
              sessionId: 's-1',
              status: 'completed',
              steps: [],
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'image',
                      image: new Uint8Array([137, 80, 78, 71]),
                      mimeType: 'image/png',
                    },
                  ],
                },
              ],
              pendingApprovals: [],
              handoffs: [],
              usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
              startedAt: 'now',
            },
          },
        };
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
      async *resume(threadId: string, directive?: { readonly resume?: unknown }) {
        await new Promise((r) => setTimeout(r, 25));
        yield { type: 'workflow.resumed', threadId, resume: directive?.resume };
        yield { type: 'workflow.completed' };
      },
    } as never,
  });
  workflows.register({
    id: 'crashy',
    workflow: {
      id: 'crashy',
      // Emits one step, then fails - the typed failure IS the fixture.
      async *execute() {
        await new Promise((r) => setTimeout(r, 25));
        yield { type: 'workflow.step.completed', stepNumber: 1 };
        const err = new Error('node boom') as Error & { code: string; hint: string };
        err.code = 'node-execution-failed';
        err.hint = 'inspect the node logs';
        throw err;
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
          parseScope('agents:invoke:binary'),
          parseScope('agents:read:binary'),
          parseScope('workflows:execute:flowy'),
          parseScope('workflows:resume:flowy'),
          parseScope('workflows:read:flowy'),
          parseScope('workflows:execute:crashy'),
          parseScope('workflows:read:crashy'),
        ],
      },
    } as never);
    await next();
  });
  app.route('/agents', createAgentRoutes({ agents, runs, dispatcher }));
  app.route('/workflows', createWorkflowRoutes({ workflows, runs, dispatcher }));
  return { app, dispatcher, runs };
}

describe('IP-2 - the streaming endpoints actually stream', () => {
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

  it('W-046: file.generated and a multimodal agent.end survive the WS path decodable', async () => {
    const { app, dispatcher } = buildApp();
    const res = await app.request('/agents/binary/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'hi' }),
    });
    expect(res.status).toBe(202);
    const body = (await res.json()) as { subscribe: { websocket: string } };
    const sub = makeSubscriber(['agents:read:binary']);
    dispatcher.registerSubscriber(sub.handle);
    dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: body.subscribe.websocket,
      subscriptionId: 'sub-bin',
    });
    await new Promise((r) => setTimeout(r, 120));
    // Simulate the real transport: every frame is JSON-stringified once.
    const frames = sub.sent
      .map(
        (f) => JSON.parse(JSON.stringify(f)) as { kind?: string; type?: string; payload?: unknown },
      )
      .filter((f) => f.kind === 'event');
    const fileFrame = frames.find((f) => f.type === 'file.generated');
    const endFrame = frames.find((f) => f.type === 'agent.end');
    expect(fileFrame).toBeDefined();
    expect(endFrame).toBeDefined();
    // The corruption signature of a raw stringified Uint8Array must not appear.
    expect(JSON.stringify(fileFrame)).not.toContain('"0":137');
    expect(JSON.stringify(endFrame)).not.toContain('"0":137');
    const decodedFile = fromWireAgentEvent(fileFrame?.payload as never) as unknown as {
      data: Uint8Array;
    };
    expect(decodedFile.data).toBeInstanceOf(Uint8Array);
    expect(decodedFile.data).toEqual(new Uint8Array([137, 80, 78, 71]));
    const decodedEnd = fromWireAgentEvent(endFrame?.payload as never) as unknown as {
      result: { state: { messages: readonly { content: readonly { image: Uint8Array }[] }[] } };
    };
    const image = decodedEnd.result.state.messages[0]?.content[0];
    expect(image?.image).toBeInstanceOf(Uint8Array);
    expect(image?.image).toEqual(new Uint8Array([137, 80, 78, 71]));
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

  it('W-052: a failing workflow delivers workflow.error with the machine-readable code + hint', async () => {
    const { app, dispatcher, runs } = buildApp();
    const res = await app.request('/workflows/crashy/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: {} }),
    });
    expect(res.status).toBe(202);
    const body = (await res.json()) as { runId: string; subscribe: { websocket: string } };
    const sub = makeSubscriber(['workflows:read:crashy']);
    dispatcher.registerSubscriber(sub.handle);
    dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: body.subscribe.websocket,
      subscriptionId: 'sub-err',
    });
    await new Promise((r) => setTimeout(r, 120));
    const frames = sub.sent
      .map((frame) => frame as { kind?: string; type?: string; payload?: Record<string, unknown> })
      .filter((frame) => frame.type === 'workflow.error');
    expect(frames).toHaveLength(1);
    const payload = frames[0]?.payload as {
      runId: string;
      code: string;
      message: string;
      hint?: string;
    };
    // The message field is UNCHANGED; code + hint ride additively.
    expect(payload.runId).toBe(body.runId);
    expect(payload.code).toBe('node-execution-failed');
    expect(payload.message).toBe('node boom');
    expect(payload.hint).toBe('inspect the node logs');
    // GET run-status reports the same code (run tracker serialization).
    const snapshot = runs.snapshot(body.runId);
    expect(snapshot?.status).toBe('failed');
    expect(snapshot?.error?.code).toBe('node-execution-failed');
    expect(snapshot?.error?.message).toBe('node boom');
  });

  it('periphery-01: POST /workflows/:id/resume actually resumes and emits on the subject', async () => {
    const { app, dispatcher, runs } = buildApp();
    const res = await app.request('/workflows/flowy/resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: 't-99', resume: { approved: true } }),
    });
    // Pre-fix: 202 'pending' that never called workflow.resume() and
    // advertised an unmounted SSE path.
    expect(res.status).toBe(202);
    const body = (await res.json()) as {
      runId: string;
      status: string;
      subscribe: { websocket: string; sse?: string };
    };
    expect(body.status).toBe('running');
    expect(body.subscribe.sse).toBeUndefined();
    const parsed = tryParseSubject(body.subscribe.websocket);
    expect(parsed.ok).toBe(true);

    const sub = makeSubscriber(['workflows:read:flowy']);
    dispatcher.registerSubscriber(sub.handle);
    const result = dispatcher.subscribe({
      subscriberId: sub.handle.id,
      subject: body.subscribe.websocket,
      subscriptionId: 'sub-r',
    });
    expect(result.ok).toBe(true);

    await new Promise((r) => setTimeout(r, 120));
    const wire = JSON.stringify(sub.sent);
    expect(wire).toContain('workflow.resumed');
    expect(wire).toContain('t-99');
    expect(runs.snapshot(body.runId)?.status).toBe('completed');
  });

  it('W-151: POST /agents/:id/stream rejects a malformed body with the same 400 as /run and registers no run', async () => {
    const { app, runs } = buildApp();
    const before = runs.runningCount();
    const bad = await app.request('/agents/streamy/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'x', bogusField: true }),
    });
    expect(bad.status).toBe(400);
    const badBody = (await bad.json()) as { error: string; issues: unknown[] };
    expect(badBody.error).toBe('config-invalid');
    expect(badBody.issues.length).toBeGreaterThan(0);
    // No run registered, nothing launched on an empty prompt.
    expect(runs.runningCount()).toBe(before);

    // The identical input against /run produces the identical envelope.
    const run = await app.request('/agents/streamy/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'x', bogusField: true }),
    });
    expect(run.status).toBe(400);
    expect(await run.json()).toEqual(badBody);

    // An EMPTY body stays valid (schema default) - 202 as before.
    const empty = await app.request('/agents/streamy/stream', { method: 'POST' });
    expect(empty.status).toBe(202);
  });
});
