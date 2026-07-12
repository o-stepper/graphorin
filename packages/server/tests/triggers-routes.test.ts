import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseScope } from '@graphorin/security/auth';
import { createScheduler, interval, type Scheduler } from '@graphorin/triggers';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import type { ServerVariables } from '../src/internal/context.js';
import { createTriggersRoutes } from '../src/triggers/routes.js';

/**
 * Build the routes app behind a stub auth middleware granting the
 * trigger scopes - the IP-17 contract under test is route semantics
 * (flag-flip vs unregister), not the auth stack.
 */
async function buildApp(options: { readonly withOrphan?: boolean } = {}): Promise<{
  readonly app: Hono<{ Variables: ServerVariables }>;
  readonly scheduler: Scheduler;
}> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-trigroutes-'));
  const { createSqliteStore } = await import('@graphorin/store-sqlite');
  const store = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  await store.init();
  if (options.withOrphan === true) {
    // Persist a row through a throwaway scheduler, then abandon it: the
    // routes scheduler below never re-registers 'ghost', which makes it
    // a true W-123 orphan (persisted, no live declaration).
    const seeder = createScheduler({ store: store.triggers, mode: 'server' });
    await seeder.register(interval('ghost', 60_000, () => {}, { acknowledgeLibMode: true }));
    await seeder.stop();
  }
  const scheduler = createScheduler({ store: store.triggers, mode: 'server' });
  await scheduler.register(interval('rt', 60_000, () => {}, { acknowledgeLibMode: true }));

  const app = new Hono<{ Variables: ServerVariables }>();
  app.use('*', async (c, next) => {
    c.set('state', {
      requestId: 'req-test',
      receivedAt: Date.now(),
      clientIp: '127.0.0.1',
      auth: {
        kind: 'token' as const,
        token: { tokenId: 't' } as never,
        grantedScopes: [
          parseScope('triggers:read'),
          parseScope('triggers:fire'),
          parseScope('triggers:disable'),
        ],
      },
    } as never);
    await next();
  });
  app.route('/triggers', createTriggersRoutes({ daemon: { scheduler } as never }));
  return { app, scheduler };
}

// buildApp() wires a real server app per test; on loaded windows-latest
// runners that setup alone has blown the 5 s default per-test timeout.
// The suite timeout is a ceiling for slow CI I/O, not a perf assertion.
describe('REST trigger routes - IP-17 semantics', { timeout: 30_000 }, () => {
  it('disable is a flag flip (trigger survives), enable restores it, both round-trip', async () => {
    const { app, scheduler } = await buildApp();

    const disable = await app.request('/triggers/rt/disable', { method: 'POST' });
    expect(disable.status).toBe(200);
    const disabledBody = (await disable.json()) as { trigger?: { disabled?: boolean } };
    expect(disabledBody.trigger?.disabled).toBe(true);

    // NOT unregistered - the trigger is still listed.
    const list = await scheduler.list();
    expect(list.some((t) => t.id === 'rt')).toBe(true);
    expect(list.find((t) => t.id === 'rt')?.disabled).toBe(true);

    // The documented enable route exists and flips it back.
    const enable = await app.request('/triggers/rt/enable', { method: 'POST' });
    expect(enable.status).toBe(200);
    const enabledBody = (await enable.json()) as { trigger?: { disabled?: boolean } };
    expect(enabledBody.trigger?.disabled).toBe(false);
    expect((await scheduler.list()).find((t) => t.id === 'rt')?.disabled).toBe(false);
  });

  it('DELETE /:id is the destructive removal', async () => {
    const { app, scheduler } = await buildApp();
    const del = await app.request('/triggers/rt', { method: 'DELETE' });
    expect(del.status).toBe(200);
    expect((await scheduler.list()).some((t) => t.id === 'rt')).toBe(false);
    // Idempotence boundary: a second DELETE is a 404, not a crash.
    const again = await app.request('/triggers/rt', { method: 'DELETE' });
    expect(again.status).toBe(404);
  });

  it('enable/disable on an unknown id is a 404', async () => {
    const { app } = await buildApp();
    expect((await app.request('/triggers/ghost/disable', { method: 'POST' })).status).toBe(404);
    expect((await app.request('/triggers/ghost/enable', { method: 'POST' })).status).toBe(404);
  });
});

describe('POST /triggers/prune - disabled + orphaned buckets (W-123)', { timeout: 30_000 }, () => {
  it('default body prunes disabled rows only; orphans survive', async () => {
    const { app, scheduler } = await buildApp({ withOrphan: true });
    await scheduler.setDisabled('rt', true);

    const res = await app.request('/triggers/prune', { method: 'POST' });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      removed: string[];
      count: number;
      disabled: string[];
      orphaned: string[];
    };
    expect(body.removed).toEqual(['rt']);
    expect(body.count).toBe(1);
    expect(body.disabled).toEqual(['rt']);
    expect(body.orphaned).toEqual([]);
    // The orphan is untouched by the default prune.
    expect((await scheduler.list()).map((t) => t.id)).toEqual(['ghost']);
  });

  it('orphaned: true removes rows without a live declaration', async () => {
    const { app, scheduler } = await buildApp({ withOrphan: true });

    const res = await app.request('/triggers/prune', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orphaned: true, disabled: false }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      removed: string[];
      disabled: string[];
      orphaned: string[];
    };
    expect(body.orphaned).toEqual(['ghost']);
    expect(body.disabled).toEqual([]);
    // The live (non-disabled) trigger survives.
    expect((await scheduler.list()).map((t) => t.id)).toEqual(['rt']);
  });

  it('rejects a malformed prune body with 400', async () => {
    const { app } = await buildApp();
    const res = await app.request('/triggers/prune', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orphaned: 'yes' }),
    });
    expect(res.status).toBe(400);
  });
});
