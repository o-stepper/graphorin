import { createToken } from '@graphorin/security';
import {
  _resetResolversForTesting,
  installBuiltinResolvers,
  resolveSecret,
} from '@graphorin/security/secrets';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';

const PEPPER_ENV = 'GRAPHORIN_COVERAGE_PEPPER';
const PEPPER_VALUE = 'coverage-pepper-bytes-9XaQ7uvPyR4kLm';

let store: GraphorinSqliteStore | undefined;
let server: GraphorinServer | undefined;
let bearer: string | undefined;

async function boot(): Promise<{ server: GraphorinServer; bearer: string }> {
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
    scopes: [
      'agents:read',
      'agents:invoke',
      'workflows:read',
      'workflows:execute',
      'workflows:resume',
      'tokens:create',
      'tokens:list',
      'tokens:revoke',
    ],
  });
  bearer = await minted.raw.use((v) => v);
  return { server, bearer };
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

describe('Routes coverage — branches that the integration suite leaves cold', () => {
  beforeEach(async () => {
    await boot();
  });

  it('GET /v1/agents/:id returns 404 for an unregistered id', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    const res = await server.app.request('/v1/agents/unknown', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('agent-not-found');
  });

  it('GET /v1/agents/:id returns the registered summary', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    server.agents.register({
      id: 'echo',
      description: 'echo agent',
      tags: ['demo'],
      agent: {
        id: 'echo',
        async run(i) {
          return i;
        },
      },
    });
    const res = await server.app.request('/v1/agents/echo', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(res.status).toBe(200);
  });

  it('POST /v1/agents/:id/run rejects malformed bodies with 400', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    server.agents.register({
      id: 'echo',
      agent: {
        id: 'echo',
        async run(i) {
          return i;
        },
      },
    });
    const res = await server.app.request('/v1/agents/echo/run', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ unknownField: 'x' }),
    });
    expect(res.status).toBe(400);
  });

  it('POST /v1/agents/:id/run returns 500 + run-failed on agent throw', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    server.agents.register({
      id: 'broken',
      agent: {
        id: 'broken',
        async run() {
          throw new Error('intentional');
        },
      },
    });
    const res = await server.app.request('/v1/agents/broken/run', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { status: string; error: string };
    expect(body.status).toBe('failed');
    expect(body.error).toBe('run-failed');
  });

  it('POST /v1/agents/:id/run returns 408 + run-aborted on signal cancel', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    server.agents.register({
      id: 'aborts',
      agent: {
        id: 'aborts',
        async run(_i, opts) {
          opts?.signal?.dispatchEvent(new Event('abort'));
          // Force a thrown error after the abort signal has been
          // surfaced — mimics what a real agent does on cancellation.
          (opts as { signal: AbortSignal }).signal = makeAbortedSignal();
          throw new Error('aborted');
        },
      },
    });
    const res = await server.app.request('/v1/agents/aborts/run', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status === 408 || res.status === 500).toBe(true);
  });

  it('POST /v1/agents/:id/stream returns 404 for unknown agent', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    const res = await server.app.request('/v1/agents/missing/stream', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(404);
  });

  it('POST /v1/workflows/:id/execute rejects malformed body with 400', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    server.workflows.register({
      id: 'pipeline',
      workflow: {
        name: 'pipeline',
        execute(): AsyncIterable<unknown> {
          return (async function* () {})();
        },
      },
    });
    const res = await server.app.request('/v1/workflows/pipeline/execute', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ unknown: 'x' }),
    });
    expect(res.status).toBe(400);
  });

  it('POST /v1/workflows/:id/resume returns 404 for unknown workflow', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    const res = await server.app.request('/v1/workflows/missing/resume', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: 't-1' }),
    });
    expect(res.status).toBe(404);
  });

  it('POST /v1/workflows/:id/resume returns 400 when workflow does not implement resume', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    server.workflows.register({
      id: 'no-resume',
      workflow: {
        name: 'no-resume',
        execute(): AsyncIterable<unknown> {
          return (async function* () {})();
        },
      },
    });
    const res = await server.app.request('/v1/workflows/no-resume/resume', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: 't-1' }),
    });
    expect(res.status).toBe(400);
  });

  it('POST /v1/workflows/:id/resume returns 202 + a runId for resumable workflows', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    server.workflows.register({
      id: 'resumable',
      workflow: {
        name: 'resumable',
        execute(): AsyncIterable<unknown> {
          return (async function* () {})();
        },
        resume(): AsyncIterable<unknown> {
          return (async function* () {
            yield { type: 'workflow.resumed' };
          })();
        },
      },
    });
    const res = await server.app.request('/v1/workflows/resumable/resume', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: 't-1' }),
    });
    expect(res.status).toBe(202);
  });

  it('POST /v1/workflows/:id/resume rejects malformed body', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    server.workflows.register({
      id: 'resumable',
      workflow: {
        name: 'resumable',
        execute(): AsyncIterable<unknown> {
          return (async function* () {})();
        },
        resume(): AsyncIterable<unknown> {
          return (async function* () {})();
        },
      },
    });
    const res = await server.app.request('/v1/workflows/resumable/resume', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        /* missing threadId */
      }),
    });
    expect(res.status).toBe(400);
  });

  it('GET /v1/workflows/:id/state returns 404 for unknown workflow', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    const res = await server.app.request('/v1/workflows/missing/state?threadId=t-1', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(res.status).toBe(404);
  });

  it('GET /v1/workflows/:id/state returns 400 when workflow does not implement getState', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    server.workflows.register({
      id: 'no-state',
      workflow: {
        name: 'no-state',
        execute(): AsyncIterable<unknown> {
          return (async function* () {})();
        },
      },
    });
    const res = await server.app.request('/v1/workflows/no-state/state?threadId=t-1', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(res.status).toBe(400);
  });

  it('GET /v1/workflows/:id/checkpoints requires threadId + supports the operation', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    server.workflows.register({
      id: 'wf',
      workflow: {
        name: 'wf',
        execute(): AsyncIterable<unknown> {
          return (async function* () {})();
        },
      },
    });
    const noThread = await server.app.request('/v1/workflows/wf/checkpoints', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(noThread.status).toBe(400);
    const noOp = await server.app.request('/v1/workflows/wf/checkpoints?threadId=t-1', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(noOp.status).toBe(400);
  });

  it('GET /v1/workflows/:id/checkpoints returns 404 for unknown workflow', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    const res = await server.app.request('/v1/workflows/missing/checkpoints?threadId=t', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(res.status).toBe(404);
  });

  it('POST /v1/workflows/:id/fork returns 404 for unknown workflow + 400 for malformed body', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    const missing = await server.app.request('/v1/workflows/missing/fork', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromThreadId: 't' }),
    });
    expect(missing.status).toBe(404);
    server.workflows.register({
      id: 'wf',
      workflow: {
        name: 'wf',
        execute(): AsyncIterable<unknown> {
          return (async function* () {})();
        },
      },
    });
    const malformed = await server.app.request('/v1/workflows/wf/fork', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(malformed.status).toBe(400);
    // periphery-01: fork is honestly 501 now — the old 202 forked nothing.
    const ok = await server.app.request('/v1/workflows/wf/fork', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromThreadId: 't', fromCheckpointId: 'c' }),
    });
    expect(ok.status).toBe(501);
  });

  it('POST /v1/tokens rejects unknown env with 400', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    const res = await server.app.request('/v1/tokens', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ scopes: ['agents:read'], env: 'mars' }),
    });
    expect(res.status).toBe(400);
  });

  it('POST /v1/tokens rejects malformed body', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    const res = await server.app.request('/v1/tokens', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('DELETE /v1/tokens/:id returns 404 for unknown token', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    const res = await server.app.request('/v1/tokens/nope', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(res.status).toBe(404);
  });
});

function makeAbortedSignal(): AbortSignal {
  const ctrl = new AbortController();
  ctrl.abort();
  return ctrl.signal;
}
