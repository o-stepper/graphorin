/**
 * Migration 038 end-to-end: a run parked on durable HITL survives a
 * FULL server restart (new store handle, new `createServer`, same
 * SQLite file) and resumes through `POST /v1/runs/:runId/resume`.
 *
 * The chain under test: run-route suspension -> tracker persistence
 * hook -> `store.suspendedRuns` row -> graceful stop (force-abort must
 * NOT erase the row) -> boot hydration on the next start -> string
 * state rehydrated through `agent.deserializeState` -> approval
 * executes the gated tool for real -> settled row dropped.
 */

import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

const PEPPER_ENV = 'GRAPHORIN_TEST_DURABLE_RESUME_PEPPER';
const PEPPER_VALUE = 'durable-resume-pepper-with-enough-bytes-Q7pT2';

let server: GraphorinServer | undefined;
let store: GraphorinSqliteStore | undefined;
let bearer: string | undefined;
let dbPath: string | undefined;

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
    modelId: 'mock-durable',
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

function gatedAgent(execute: () => Promise<string>, finalText: string) {
  return createAgent({
    name: 'approver',
    instructions: 'work',
    provider: mockProvider([toolCallScript('tc-report', 'send_report'), textScript(finalText)]),
    tools: [gatedTool(execute)],
  });
}

/** Agent whose only script is the post-approval final text (restarted process). */
function resumeOnlyAgent(execute: () => Promise<string>, finalText: string) {
  return createAgent({
    name: 'approver',
    instructions: 'work',
    provider: mockProvider([textScript(finalText)]),
    tools: [gatedTool(execute)],
  });
}

async function bootServer(): Promise<void> {
  _resetResolversForTesting();
  installBuiltinResolvers();
  process.env[PEPPER_ENV] = PEPPER_VALUE;
  if (dbPath === undefined) {
    const dir = await mkdtemp(join(tmpdir(), 'graphorin-durable-resume-'));
    dbPath = join(dir, 'db.sqlite');
  }
  store = await createSqliteStore({
    path: dbPath,
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
      storage: { path: dbPath, mode: 'lib' },
      server: { rateLimit: { enabled: false }, csrf: { enabled: false } },
    },
  });
  await server.start();
  if (bearer === undefined) {
    const pepper = await resolveSecret(`env:${PEPPER_ENV}`);
    const minted = await createToken({
      tokenStore: store.authTokens,
      pepper,
      env: 'live',
      scopes: ['agents:read', 'agents:invoke'],
    });
    bearer = await minted.raw.use((v) => v);
  }
}

async function shutdown(): Promise<void> {
  if (server !== undefined) {
    await server.stop().catch(() => {});
    server = undefined;
  }
  if (store !== undefined) {
    await store.close().catch(() => {});
    store = undefined;
  }
}

/** Full process-restart simulation: stop, close, reopen the same file. */
async function restartServer(): Promise<void> {
  await shutdown();
  await bootServer();
}

beforeEach(async () => {
  dbPath = undefined;
  bearer = undefined;
  await bootServer();
});

afterEach(async () => {
  await shutdown();
  delete process.env[PEPPER_ENV];
});

function srv(): GraphorinServer {
  if (server === undefined) throw new Error('not booted');
  return server;
}

function db(): GraphorinSqliteStore {
  if (store === undefined) throw new Error('no store');
  return store;
}

function auth(): Record<string, string> {
  return { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' };
}

async function parkRun(): Promise<string> {
  const execute = vi.fn(async () => 'sent');
  srv().agents.register({
    id: 'approver',
    description: 'gated agent',
    agent: gatedAgent(execute, 'unused'),
  });
  const runRes = await srv().app.request('/v1/agents/approver/run', {
    method: 'POST',
    headers: auth(),
    body: JSON.stringify({ input: 'send the report', sessionId: 'sess-durable' }),
  });
  expect(runRes.status).toBe(200);
  const runBody = (await runRes.json()) as { runId: string; status: string };
  expect(runBody.status).toBe('awaiting_approval');
  expect(execute).not.toHaveBeenCalled();
  return runBody.runId;
}

describe('migration 038 - suspended runs survive a server restart', () => {
  it('park -> restart -> state visible -> resume executes the tool -> row dropped', async () => {
    const runId = await parkRun();

    // The suspension hook mirrored the park durably, session-scoped.
    const row = await db().suspendedRuns.get(runId);
    expect(row?.agentId).toBe('approver');
    expect(row?.sessionId).toBe('sess-durable');
    expect(JSON.parse(row?.stateJson ?? '{}')).toMatchObject({
      version: expect.stringMatching(/^graphorin-run-state\//),
    });

    // Graceful stop force-aborts in-memory runs but must keep the row.
    await restartServer();
    expect(await db().suspendedRuns.get(runId)).toBeDefined();

    // Fresh process: hydration re-registered the park.
    const stateRes = await srv().app.request(`/v1/runs/${runId}/state`, { headers: auth() });
    expect(stateRes.status).toBe(200);
    expect(((await stateRes.json()) as { status: string }).status).toBe('awaiting_approval');

    // Register the agent (a restarted bot re-registers its agents) and
    // approve: the gated tool executes for real in the NEW process.
    const execute = vi.fn(async () => 'sent-after-restart');
    srv().agents.register({
      id: 'approver',
      description: 'gated agent',
      agent: resumeOnlyAgent(execute, 'Report delivered after the restart.'),
    });
    const resumeRes = await srv().app.request(`/v1/runs/${runId}/resume`, {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({ approvals: [{ toolCallId: 'tc-report', granted: true }] }),
    });
    expect(resumeRes.status).toBe(200);
    const body = (await resumeRes.json()) as { status: string; result: { output: string } };
    expect(body.status).toBe('completed');
    expect(body.result.output).toContain('after the restart');
    expect(execute).toHaveBeenCalledTimes(1);

    // Settled -> the durable row is gone.
    await vi.waitFor(async () => {
      expect(await db().suspendedRuns.get(runId)).toBeUndefined();
    });
  });

  it('an explicit abort after the restart settles the park and drops the row', async () => {
    const runId = await parkRun();
    await restartServer();
    expect(await db().suspendedRuns.get(runId)).toBeDefined();

    const abortRes = await srv().app.request(`/v1/runs/${runId}/abort`, {
      method: 'POST',
      headers: auth(),
    });
    expect(abortRes.status).toBe(200);
    expect(await db().suspendedRuns.get(runId)).toBeUndefined();

    const resumeRes = await srv().app.request(`/v1/runs/${runId}/resume`, {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({ approvals: [{ toolCallId: 'tc-report', granted: true }] }),
    });
    expect(resumeRes.status).toBe(409);
    expect(((await resumeRes.json()) as { error: string }).error).toBe('run-not-suspended');
  });

  it('a codec-less registry agent yields the actionable 409, not a crash', async () => {
    const runId = await parkRun();
    await restartServer();

    // The restarted process registered a hand-rolled ServerAgentLike
    // without deserializeState - the hydrated string cannot rehydrate.
    srv().agents.register({
      id: 'approver',
      description: 'plain fixture',
      agent: { id: 'approver', run: async () => 'x' },
    });
    const resumeRes = await srv().app.request(`/v1/runs/${runId}/resume`, {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({ approvals: [{ toolCallId: 'tc-report', granted: true }] }),
    });
    expect(resumeRes.status).toBe(409);
    const body = (await resumeRes.json()) as { error: string; message: string };
    expect(body.error).toBe('run-state-unavailable');
    expect(body.message).toContain('deserializeState');
    // The park is untouched - a proper build can still resume it.
    expect(await db().suspendedRuns.get(runId)).toBeDefined();
  });

  it('a corrupted durable state surfaces as run-state-invalid (500)', async () => {
    const runId = await parkRun();
    await shutdown();
    await bootServer();
    // Corrupt the row AFTER hydration read it - hydration retains the
    // string verbatim, so corrupt it in the TRACKER's copy by
    // re-registering through the public bridge (the realistic shape is
    // a truncated/edited sidecar read at boot).
    srv().runs.registerSuspended(
      runId,
      { kind: 'agent', agentId: 'approver' },
      '{"version":"graphorin-run-state/1.2"',
    );
    srv().agents.register({
      id: 'approver',
      description: 'gated agent',
      agent: resumeOnlyAgent(async () => 'x', 'unused'),
    });
    const resumeRes = await srv().app.request(`/v1/runs/${runId}/resume`, {
      method: 'POST',
      headers: auth(),
      body: JSON.stringify({ approvals: [{ toolCallId: 'tc-report', granted: true }] }),
    });
    expect(resumeRes.status).toBe(500);
    expect(((await resumeRes.json()) as { error: string }).error).toBe('run-state-invalid');
  });
});
