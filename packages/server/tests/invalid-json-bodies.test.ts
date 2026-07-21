/**
 * deep-retest-0.13.10 P1 (NEG-E2E-SERVER-JSON-01): a syntactically
 * broken JSON body (`'{"input":'`) used to be swallowed into `{}` by
 * the per-route parse helpers, satisfy the `.default({})` schemas,
 * and EXECUTE agents and workflows behind an HTTP 200/202. These
 * tests pin the corrected contract end-to-end:
 *
 *  - truncated JSON -> 400 `invalid-json`, zero executions, on the
 *    sync run, streaming run, resume, workflow execute, and token
 *    mint surfaces;
 *  - a genuinely EMPTY body keeps its documented meaning (`{}` +
 *    schema defaults) - the fix must not break bodiless POSTs;
 *  - an Idempotency-Key sent with a broken body is NOT reserved: the
 *    corrected retry under the same key executes normally instead of
 *    colliding with a stored 400.
 */

import { createToken } from '@graphorin/security';
import {
  _resetResolversForTesting,
  installBuiltinResolvers,
  resolveSecret,
} from '@graphorin/security/secrets';
import { createSqliteStore, type GraphorinSqliteStore } from '@graphorin/store-sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createServer, type GraphorinServer } from '../src/app.js';

const PEPPER_ENV = 'GRAPHORIN_INVALID_JSON_PEPPER';
const PEPPER_VALUE = 'invalid-json-pepper-bytes-7KwT2mVqXz9c';
const TRUNCATED = '{"input":';

let store: GraphorinSqliteStore | undefined;
let server: GraphorinServer | undefined;
let bearer: string | undefined;

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
    scopes: [
      'agents:read',
      'agents:invoke',
      'workflows:execute',
      'workflows:resume',
      'tokens:create',
    ],
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

function post(path: string, body: string | undefined, headers: Record<string, string> = {}) {
  if (server === undefined || bearer === undefined) throw new Error('not booted');
  return server.app.request(path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearer}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body !== undefined ? { body } : {}),
  });
}

async function expectInvalidJson(res: Response): Promise<void> {
  expect(res.status).toBe(400);
  const payload = (await res.json()) as { error: string };
  expect(payload.error).toBe('invalid-json');
}

describe('deep-retest-0.13.10 P1 - truncated JSON bodies never execute', () => {
  let runs = 0;

  beforeEach(async () => {
    await boot();
    runs = 0;
    server?.agents.register({
      id: 'counter',
      agent: {
        id: 'counter',
        run: async (i: unknown) => {
          runs += 1;
          return i;
        },
      },
    });
  });

  it('POST /v1/agents/:id/run returns 400 and does not run the agent', async () => {
    const res = await post('/v1/agents/counter/run', TRUNCATED);
    await expectInvalidJson(res);
    expect(runs).toBe(0);
  });

  it('POST /v1/agents/:id/stream returns 400 (not 202) and starts nothing', async () => {
    const res = await post('/v1/agents/counter/stream', TRUNCATED);
    await expectInvalidJson(res);
    await new Promise((r) => setTimeout(r, 25));
    expect(runs).toBe(0);
  });

  it('POST /v1/agents/:id/runs/:runId/resume - resource existence wins for an unknown run, and nothing executes', async () => {
    // The resume route checks run existence BEFORE parsing the body
    // (conventional REST ordering); an unknown run yields 404 either
    // way. The 400-on-truncated contract for resume-shaped bodies is
    // pinned on /v1/workflows/:id/resume above, where the parse runs
    // first.
    const res = await post('/v1/agents/counter/runs/does-not-exist/resume', TRUNCATED);
    expect(res.status).toBe(404);
    expect(runs).toBe(0);
  });

  it('POST /v1/workflows/:id/execute returns 400 and does not execute', async () => {
    let executions = 0;
    server?.workflows.register({
      id: 'side-effect',
      workflow: {
        execute: async () => {
          executions += 1;
          return { status: 'completed' };
        },
      } as never,
    });
    const res = await post('/v1/workflows/side-effect/execute', TRUNCATED);
    await expectInvalidJson(res);
    await new Promise((r) => setTimeout(r, 25));
    expect(executions).toBe(0);
  });

  it('POST /v1/workflows/:id/resume returns 400', async () => {
    server?.workflows.register({
      id: 'resumable',
      workflow: { execute: async () => ({ status: 'completed' }) } as never,
    });
    const res = await post('/v1/workflows/resumable/resume', TRUNCATED);
    await expectInvalidJson(res);
  });

  it('POST /v1/tokens returns 400 invalid-json (not a schema error about {})', async () => {
    const res = await post('/v1/tokens', '{"scopes":');
    await expectInvalidJson(res);
  });

  it('an EMPTY body keeps its documented meaning - the run executes with schema defaults', async () => {
    const res = await post('/v1/agents/counter/run', undefined);
    expect(res.status).toBe(200);
    expect(runs).toBe(1);
  });

  it('a broken body does NOT reserve the Idempotency-Key - the corrected retry executes', async () => {
    const key = 'invalid-json-retry-0001';
    const broken = await post('/v1/agents/counter/run', TRUNCATED, { 'Idempotency-Key': key });
    await expectInvalidJson(broken);
    expect(runs).toBe(0);

    // Same key, corrected body: must execute fresh (no stored 400, no
    // fingerprint conflict).
    const fixed = await post('/v1/agents/counter/run', JSON.stringify({}), {
      'Idempotency-Key': key,
    });
    expect(fixed.status).toBe(200);
    expect(runs).toBe(1);

    // And the key now replays the SUCCESS, exactly once.
    const replay = await post('/v1/agents/counter/run', JSON.stringify({}), {
      'Idempotency-Key': key,
    });
    expect(replay.status).toBe(200);
    expect(replay.headers.get('Idempotency-Replayed')).toBe('true');
    expect(runs).toBe(1);
  });
});
