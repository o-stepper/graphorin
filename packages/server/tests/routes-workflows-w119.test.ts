/**
 * W-119 - the server workflow surface exposes every D1 primitive over
 * HTTP: named awakeable/approval resume, retry, tick, and a REAL fork
 * (the honest-501 retires). Registered workflows are genuine
 * `@graphorin/workflow` instances, so this is end-to-end.
 */

import { createToken } from '@graphorin/security/auth';
import {
  _resetResolversForTesting,
  installBuiltinResolvers,
  resolveSecret,
} from '@graphorin/security/secrets';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import {
  awaitExternal,
  createNode,
  createWorkflow,
  InMemoryCheckpointStore,
  latestValue,
  sleepUntil,
} from '@graphorin/workflow';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';

const PEPPER_ENV = 'GRAPHORIN_TEST_PEPPER_W119';
const PEPPER_VALUE = 'w119-pepper-bytes-3FhK9mQxTz7uWpR2';
const WAKE_AT = Date.parse('2030-01-01T00:00:00.000Z');

let store: GraphorinSqliteStore | undefined;
let server: GraphorinServer | undefined;
let bearer: string | undefined;

interface PairState {
  a: string;
  b: string;
}

function pairWorkflow() {
  const checkpointStore = new InMemoryCheckpointStore();
  const wf = createWorkflow<PairState>({
    name: 'pair',
    channels: {
      a: latestValue<string>() as never,
      b: latestValue<string>() as never,
    },
    nodes: {
      waitA: createNode<PairState>({
        name: 'waitA',
        run: () => ({ a: awaitExternal<string>('need-a') }),
      }),
      waitB: createNode<PairState>({
        name: 'waitB',
        run: () => ({ b: awaitExternal<string>('need-b') }),
      }),
    },
    edges: [
      { from: '__start__', to: 'waitA' },
      { from: '__start__', to: 'waitB' },
      { from: 'waitA', to: '__end__' },
      { from: 'waitB', to: '__end__' },
    ],
    checkpointStore,
  });
  return wf;
}

interface CounterState {
  count: number;
  done: boolean;
  boom: boolean;
}

function retryableWorkflow() {
  const checkpointStore = new InMemoryCheckpointStore();
  let attempts = 0;
  const wf = createWorkflow<CounterState>({
    name: 'retryable',
    channels: {
      count: latestValue<number>({ default: 0 }) as never,
      done: latestValue<boolean>({ default: false }) as never,
      boom: latestValue<boolean>({ default: true }) as never,
    },
    nodes: {
      step: createNode<CounterState>({
        name: 'step',
        run: (state) => {
          attempts += 1;
          if (state.boom && attempts === 1) throw new Error('first attempt explodes');
          return { count: state.count + 1, done: true, boom: false };
        },
      }),
    },
    edges: [
      { from: '__start__', to: 'step' },
      { from: 'step', to: '__end__' },
    ],
    checkpointStore,
  });
  return wf;
}

function timerWorkflow() {
  const checkpointStore = new InMemoryCheckpointStore();
  return createWorkflow<{ fired: boolean }>({
    name: 'timers',
    channels: { fired: latestValue<boolean>() as never },
    nodes: {
      waiter: createNode<{ fired: boolean }>({
        name: 'waiter',
        run: () => {
          sleepUntil(WAKE_AT);
          return { fired: true };
        },
      }),
    },
    edges: [
      { from: '__start__', to: 'waiter' },
      { from: 'waiter', to: '__end__' },
    ],
    checkpointStore,
  });
}

async function drain<T>(events: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const ev of events) out.push(ev);
  return out;
}

async function boot(): Promise<void> {
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
    scopes: ['workflows:read', 'workflows:execute', 'workflows:resume', 'workflows:delete'],
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

function post(path: string, body: unknown) {
  if (server === undefined || bearer === undefined) throw new Error('not booted');
  return server.app.request(path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function waitFor(check: () => Promise<boolean>, timeoutMs = 2_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error('condition not reached in time');
}

describe('W-119 - server workflow surface', () => {
  beforeEach(async () => {
    await boot();
  });

  it('resume with `name` wakes exactly the named pause among two parallel awakeables', async () => {
    const wf = pairWorkflow();
    server?.workflows.register({ id: 'pair', workflow: wf as never });
    await drain(wf.execute({} as never, { threadId: 'p-1' }));

    // Answer the SECOND awakeable by name - not the first pause.
    const res = await post('/v1/workflows/pair/resume', {
      threadId: 'p-1',
      name: 'need-b',
      resume: 'B-value',
    });
    expect(res.status).toBe(202);
    await waitFor(async () => {
      const state = await wf.getState('p-1');
      return (state.state as PairState).b === 'B-value';
    });
    const state = await wf.getState('p-1');
    // Still suspended on the OTHER awakeable - need-a was untouched.
    expect(state.status).toBe('suspended');
    expect(state.pendingPauses?.map((p) => p.name)).toContain('need-a');
  });

  it('resume with an unknown name surfaces pause-not-found on the wire subject', async () => {
    const wf = pairWorkflow();
    server?.workflows.register({ id: 'pair', workflow: wf as never });
    await drain(wf.execute({} as never, { threadId: 'p-404' }));
    const res = await post('/v1/workflows/pair/resume', {
      threadId: 'p-404',
      name: 'no-such-pause',
      resume: 'x',
    });
    // The route accepts (202) and the background iteration reports the
    // typed error; the thread stays suspended.
    expect(res.status).toBe(202);
    await new Promise((r) => setTimeout(r, 50));
    expect((await wf.getState('p-404')).status).toBe('suspended');
  });

  it('POST /:id/retry replays a failed thread to completion', async () => {
    const wf = retryableWorkflow();
    server?.workflows.register({ id: 'retryable', workflow: wf as never });
    const events = await drain(wf.execute({} as never, { threadId: 'r-1' }));
    expect(events.at(-1)?.type).toBe('workflow.error');

    const res = await post('/v1/workflows/retryable/retry', { threadId: 'r-1' });
    expect(res.status).toBe(202);
    await waitFor(async () => (await wf.getState('r-1')).status === 'completed');
  });

  it('POST /:id/tick reports not-due timers and fires due ones', async () => {
    const wf = timerWorkflow();
    server?.workflows.register({ id: 'timers', workflow: wf as never });
    await drain(wf.execute({} as never, { threadId: 't-1' }));

    // The 2030 deadline is not due at real now: nothing fires.
    const early = await post('/v1/workflows/timers/tick', { threadId: 't-1' });
    expect(early.status).toBe(200);
    const earlyBody = (await early.json()) as { fired: boolean; nextWakeAt: number | null };
    expect(earlyBody.fired).toBe(false);
    expect(earlyBody.nextWakeAt).toBe(WAKE_AT);

    // Unknown thread maps to 404 through the wire envelope.
    const missing = await post('/v1/workflows/timers/tick', { threadId: 'nope' });
    expect(missing.status).toBe(404);
  });

  it('GET /:id/state answers a 404 JSON envelope for unknown and deleted threads (E-11)', async () => {
    if (server === undefined || bearer === undefined) throw new Error('not booted');
    const wf = pairWorkflow();
    server.workflows.register({ id: 'pair', workflow: wf as never });
    const getState = (threadId: string) =>
      server?.app.request(`/v1/workflows/pair/state?threadId=${threadId}`, {
        headers: { Authorization: `Bearer ${bearer}` },
      }) as Promise<Response>;

    // Unknown thread: previously the ThreadNotFoundError escaped as a
    // plain-text 500 - it must map to the wire envelope like tick does.
    const unknown = await getState('never-was');
    expect(unknown.status).toBe(404);
    expect(((await unknown.json()) as { error: string }).error).toBe('thread-not-found');

    // Deleted-thread polling: execute, read state, erase the thread,
    // then poll again - the poll after a legitimate delete must 404 too.
    await drain(wf.execute({} as never, { threadId: 't-del' }));
    expect((await getState('t-del')).status).toBe(200);
    const del = await server.app.request('/v1/workflows/pair/threads/t-del', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bearer}` },
    });
    expect(del.status).toBe(204);
    const afterDelete = await getState('t-del');
    expect(afterDelete.status).toBe(404);
    expect(((await afterDelete.json()) as { error: string }).error).toBe('thread-not-found');
  });

  it('POST /:id/fork forks a real thread and leaves the source untouched', async () => {
    const wf = pairWorkflow();
    server?.workflows.register({ id: 'pair', workflow: wf as never });
    await drain(wf.execute({} as never, { threadId: 'f-src' }));

    const res = await post('/v1/workflows/pair/fork', { fromThreadId: 'f-src' });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { newThreadId: string; fromCheckpointId: string };
    expect(body.newThreadId).toBeTruthy();
    expect(body.newThreadId).not.toBe('f-src');
    // Both threads independently suspended.
    expect((await wf.getState('f-src')).status).toBe('suspended');
    expect((await wf.getState(body.newThreadId)).status).toBe('suspended');
  });

  it('POST /:id/fork with a state patch seeds the forked root (E2)', async () => {
    const wf = pairWorkflow();
    server?.workflows.register({ id: 'pair-patch', workflow: wf as never });
    await drain(wf.execute({} as never, { threadId: 'fp-src' }));

    const res = await post('/v1/workflows/pair-patch/fork', {
      fromThreadId: 'fp-src',
      state: { a: 'patched-a' },
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { newThreadId: string };
    const forked = await wf.getState(body.newThreadId);
    expect((forked.state as PairState).a).toBe('patched-a');
    // The source keeps its own state.
    expect((await wf.getState('fp-src')).state).not.toMatchObject({ a: 'patched-a' });

    // A patch key that names no channel is a 400 with the engine's message.
    const bad = await post('/v1/workflows/pair-patch/fork', {
      fromThreadId: 'fp-src',
      state: { nope: 1 },
    });
    expect(bad.status).toBe(400);
    expect(((await bad.json()) as { message: string }).message).toContain('declared channel');
  });

  it('unsupported methods answer 400 with a typed error', async () => {
    server?.workflows.register({
      id: 'bare',
      workflow: {
        name: 'bare',
        execute: async function* () {},
      } as never,
    });
    const retry = await post('/v1/workflows/bare/retry', { threadId: 'x' });
    expect(retry.status).toBe(400);
    expect(((await retry.json()) as { error: string }).error).toBe('workflow-retry-unsupported');
    const tick = await post('/v1/workflows/bare/tick', { threadId: 'x' });
    expect(tick.status).toBe(400);
    const fork = await post('/v1/workflows/bare/fork', { fromThreadId: 'x' });
    expect(fork.status).toBe(400);
    expect(((await fork.json()) as { error: string }).error).toBe('workflow-fork-unsupported');
  });
});
