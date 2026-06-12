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
 * trigger scopes — the IP-17 contract under test is route semantics
 * (flag-flip vs unregister), not the auth stack.
 */
async function buildApp(): Promise<{
  readonly app: Hono<{ Variables: ServerVariables }>;
  readonly scheduler: Scheduler;
}> {
  const dir = await mkdtemp(join(tmpdir(), 'graphorin-trigroutes-'));
  const { createSqliteStore } = await import('@graphorin/store-sqlite');
  const store = await createSqliteStore({ path: `${dir}/db.sqlite`, skipSqliteVec: true });
  await store.init();
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

describe('REST trigger routes — IP-17 semantics', () => {
  it('disable is a flag flip (trigger survives), enable restores it, both round-trip', async () => {
    const { app, scheduler } = await buildApp();

    const disable = await app.request('/triggers/rt/disable', { method: 'POST' });
    expect(disable.status).toBe(200);
    const disabledBody = (await disable.json()) as { trigger?: { disabled?: boolean } };
    expect(disabledBody.trigger?.disabled).toBe(true);

    // NOT unregistered — the trigger is still listed.
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
