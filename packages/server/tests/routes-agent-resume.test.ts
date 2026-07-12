/**
 * C3 / W-119 residual: the agent HITL resume endpoint (formerly a 501).
 *
 * Covers the full messenger loop server-side: a run parks on a gated
 * tool (`awaiting_approval`), the tracker retains the resumable
 * RunState, and `POST /v1/runs/:runId/resume` re-enters the REAL agent
 * loop with the approval decisions - including the proactive bridge
 * (`runs.registerSuspended`) for fires executed outside the REST
 * surface.
 */

import { createAgent } from '@graphorin/agent';
import type {
  Provider,
  ProviderEvent,
  ProviderRequest,
  ProviderResponse,
  Tool,
} from '@graphorin/core';
import { createToken } from '@graphorin/security';
import {
  _resetResolversForTesting,
  installBuiltinResolvers,
  resolveSecret,
} from '@graphorin/security/secrets';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';

const PEPPER_ENV = 'GRAPHORIN_TEST_RESUME_PEPPER';
const PEPPER_VALUE = 'resume-pepper-with-enough-bytes-K3xW9mN';

let server: GraphorinServer | undefined;
let store: GraphorinSqliteStore | undefined;
let bearer: string | undefined;

interface MockScript {
  readonly events: ReadonlyArray<ProviderEvent>;
}

function textScript(text: string): MockScript {
  return {
    events: [
      { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
      { type: 'text-delta', delta: text },
      {
        type: 'finish',
        finishReason: 'stop',
        usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
      },
    ],
  };
}

function toolCallScript(toolCallId: string, toolName: string): MockScript {
  return {
    events: [
      { type: 'stream-start', metadata: { providerName: 'mock', modelId: 'mock' } },
      { type: 'tool-call-start', toolCallId, toolName },
      { type: 'tool-call-input-delta', toolCallId, argsDelta: '{}' },
      { type: 'tool-call-end', toolCallId, finalArgs: {} },
      {
        type: 'finish',
        finishReason: 'tool-calls',
        usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
      },
    ],
  };
}

function mockProvider(scripts: ReadonlyArray<MockScript>): Provider {
  let cursor = 0;
  return {
    name: 'mock',
    modelId: 'mock-resume',
    capabilities: {
      streaming: true,
      toolCalling: true,
      parallelToolCalls: true,
      multimodal: false,
      structuredOutput: true,
      reasoning: false,
      contextWindow: 200000,
      maxOutput: 8192,
    },
    async *stream(_req: ProviderRequest): AsyncIterable<ProviderEvent> {
      const script = scripts[cursor++];
      if (script === undefined) {
        yield { type: 'error', error: { kind: 'unknown', message: 'no script' } };
        return;
      }
      for (const ev of script.events) yield ev;
    },
    async generate(): Promise<ProviderResponse> {
      throw new Error('use stream');
    },
  };
}

const passthroughSchema = {
  parse: (v: unknown) => v,
  safeParse: (v: unknown) => ({ success: true as const, data: v }),
  toJSON: (): Record<string, unknown> => ({ type: 'object' }),
} as Tool<unknown, unknown, unknown>['inputSchema'];

function gatedTool(execute: () => Promise<string>): Tool<unknown, unknown, unknown> {
  return {
    name: 'send_report',
    description: 'send the report (gated)',
    inputSchema: passthroughSchema,
    sideEffectClass: 'side-effecting',
    needsApproval: true,
    execute,
  } as Tool<unknown, unknown, unknown>;
}

async function bootServer(): Promise<void> {
  _resetResolversForTesting();
  installBuiltinResolvers();
  process.env[PEPPER_ENV] = PEPPER_VALUE;
  store = await createSqliteStore({
    path: ':memory:',
    mode: 'lib',
    skipSqliteVec: true,
    disableWalHardening: true,
  });
  server = await createServer({
    store,
    skipHardening: true,
    skipListen: true,
    config: {
      auth: { kind: 'token', pepperRef: `env:${PEPPER_ENV}` },
      storage: { path: ':memory:', mode: 'lib' },
      server: { rateLimit: { enabled: false }, csrf: { enabled: false } },
    },
  });
  await server.start();
  const pepper = await resolveSecret(`env:${PEPPER_ENV}`);
  const minted = await createToken({
    tokenStore: store.authTokens,
    pepper,
    env: 'live',
    scopes: ['agents:read', 'agents:invoke'],
  });
  bearer = await minted.raw.use((v) => v);
}

afterEach(async () => {
  if (server !== undefined) {
    await server.stop().catch(() => {});
    server = undefined;
  }
  if (store !== undefined) {
    await store.close().catch(() => {});
    store = undefined;
  }
  delete process.env[PEPPER_ENV];
  bearer = undefined;
});

function srv(): GraphorinServer {
  if (server === undefined) throw new Error('not booted');
  return server;
}

function auth(): Record<string, string> {
  return { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' };
}

describe('POST /v1/runs/:runId/resume (C3 / W-119)', () => {
  beforeEach(async () => {
    await bootServer();
  });

  it('resumes a run suspended through POST /agents/:id/run: approval executes the gated tool for real', async () => {
    const execute = vi.fn(async () => 'report sent');
    const agent = createAgent({
      name: 'approver',
      instructions: 'work',
      provider: mockProvider([
        toolCallScript('tc-report', 'send_report'),
        textScript('Report delivered to the owner.'),
      ]),
      tools: [gatedTool(execute)],
    });
    srv().agents.register({ id: 'approver', description: 'gated agent', agent });

    const runRes = await srv().app.request('/v1/agents/approver/run', {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({ input: 'send the report' }),
    });
    expect(runRes.status).toBe(200);
    const runBody = (await runRes.json()) as {
      runId: string;
      status: string;
      result: { status: string; state: { pendingApprovals: Array<{ toolCallId: string }> } };
    };
    expect(runBody.status).toBe('awaiting_approval');
    const toolCallId = runBody.result.state.pendingApprovals[0]?.toolCallId;
    expect(toolCallId).toBe('tc-report');
    expect(execute).not.toHaveBeenCalled();

    // The tracker reports the suspension on the state surface.
    const stateRes = await srv().app.request(`/v1/runs/${runBody.runId}/state`, {
      headers: auth(),
    });
    expect(((await stateRes.json()) as { status: string }).status).toBe('awaiting_approval');

    const resumeRes = await srv().app.request(`/v1/runs/${runBody.runId}/resume`, {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({ approvals: [{ toolCallId: 'tc-report', granted: true }] }),
    });
    expect(resumeRes.status).toBe(200);
    const resumeBody = (await resumeRes.json()) as {
      status: string;
      result: { status: string; output: string };
    };
    expect(resumeBody.status).toBe('completed');
    expect(resumeBody.result.output).toContain('Report delivered');
    expect(execute).toHaveBeenCalledTimes(1);

    // A second resume finds nothing to resume.
    const again = await srv().app.request(`/v1/runs/${runBody.runId}/resume`, {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({ approvals: [{ toolCallId: 'tc-report', granted: true }] }),
    });
    expect(again.status).toBe(409);
    expect(((await again.json()) as { error: string }).error).toBe('run-not-suspended');
  });

  it('a denied approval resumes the run without executing the tool', async () => {
    const execute = vi.fn(async () => 'never');
    const agent = createAgent({
      name: 'denier',
      instructions: 'work',
      provider: mockProvider([
        toolCallScript('tc-x', 'send_report'),
        textScript('Understood - the report stays unsent.'),
      ]),
      tools: [gatedTool(execute)],
    });
    srv().agents.register({ id: 'denier', description: 'gated agent', agent });

    const runRes = await srv().app.request('/v1/agents/denier/run', {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({ input: 'send it' }),
    });
    const runBody = (await runRes.json()) as { runId: string; status: string };
    expect(runBody.status).toBe('awaiting_approval');

    const resumeRes = await srv().app.request(`/v1/runs/${runBody.runId}/resume`, {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({
        approvals: [{ toolCallId: 'tc-x', granted: false, reason: 'not today' }],
      }),
    });
    expect(resumeRes.status).toBe(200);
    const body = (await resumeRes.json()) as { status: string };
    expect(body.status).toBe('completed');
    expect(execute).not.toHaveBeenCalled();
  });

  it('resumes a proactive fire registered via runs.registerSuspended (the messenger bridge)', async () => {
    const execute = vi.fn(async () => 'rotated');
    const agent = createAgent({
      name: 'proactive-agent',
      instructions: 'work',
      provider: mockProvider([
        toolCallScript('tc-rotate', 'send_report'),
        textScript('Backups rotated after your approval.'),
      ]),
      tools: [gatedTool(execute)],
    });
    // The proactive fire ran IN-PROCESS (outside REST) and parked.
    const parked = await agent.run('rotate backups');
    expect(parked.status).toBe('awaiting_approval');
    const runId = parked.state.id;

    // The bot bridges the suspension into the server tracker and
    // registers the dedicated agent, so the messenger can resolve the
    // ref through the existing REST route.
    srv().agents.register({ id: 'proactive-nightly', description: 'proactive task', agent });
    srv().runs.registerSuspended(
      runId,
      { kind: 'agent', agentId: 'proactive-nightly' },
      parked.state,
    );

    const resumeRes = await srv().app.request(`/v1/runs/${runId}/resume`, {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({ approvals: [{ toolCallId: 'tc-rotate', granted: true }] }),
    });
    expect(resumeRes.status).toBe(200);
    const body = (await resumeRes.json()) as { status: string; result: { output: string } };
    expect(body.status).toBe('completed');
    expect(body.result.output).toContain('rotated after your approval');
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('rejects a malformed body with 400 and keeps the suspension intact', async () => {
    const agent = createAgent({
      name: 'strict',
      instructions: 'work',
      provider: mockProvider([toolCallScript('tc-1', 'send_report')]),
      tools: [gatedTool(async () => 'x')],
    });
    srv().agents.register({ id: 'strict', description: 'gated agent', agent });
    const runRes = await srv().app.request('/v1/agents/strict/run', {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({ input: 'go' }),
    });
    const runBody = (await runRes.json()) as { runId: string };

    const bad = await srv().app.request(`/v1/runs/${runBody.runId}/resume`, {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({ approvals: [] }),
    });
    expect(bad.status).toBe(400);

    const state = await srv().app.request(`/v1/runs/${runBody.runId}/state`, {
      headers: auth(),
    });
    expect(((await state.json()) as { status: string }).status).toBe('awaiting_approval');
  });

  it('the tracker retains suspensions across prune and clears them on abort', async () => {
    const runs = srv().runs;
    runs.registerSuspended('kept-run', { kind: 'agent', agentId: 'x' }, { id: 'kept-run' });
    // A retention sweep far in the future must NOT evict a parked
    // approval - a human answer can take hours.
    runs.prune(Date.now() + 60 * 60 * 1000);
    expect(runs.snapshot('kept-run')?.status).toBe('awaiting_approval');
    expect(runs.suspendedStateOf('kept-run')).toBeDefined();

    runs.abort('kept-run');
    expect(runs.snapshot('kept-run')?.status).toBe('aborted');
    expect(runs.suspendedStateOf('kept-run')).toBeUndefined();
  });
});
