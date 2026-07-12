/**
 * REST routes for the `/v1/triggers` family. Mounted by the server
 * factory when a {@link TriggersDaemon} is wired in.
 *
 *   GET    /triggers                    (scope `triggers:read`)
 *   GET    /triggers/:id                (scope `triggers:read`)
 *   POST   /triggers/:id/fire           (scope `triggers:fire`)
 *   POST   /triggers/:id/disable        (scope `triggers:disable`) - flag flip
 *   POST   /triggers/:id/enable         (scope `triggers:disable`) - flag flip
 *   DELETE /triggers/:id                (scope `triggers:disable`) - unregister
 *   POST   /triggers/prune              (scope `triggers:disable`)
 *     body { disabled?: boolean = true, orphaned?: boolean = false } -
 *     `orphaned: true` additionally removes persisted rows with no
 *     live declaration in this process (W-123); only the running
 *     server can tell those apart, which is why the offline CLI prune
 *     cannot.
 *
 * Response shapes mirror the persisted `TriggerState` rows so CLI +
 * dashboard consumers can render them without re-mapping.
 *
 * @packageDocumentation
 */

import type { TriggerState } from '@graphorin/core/contracts';
import type { Scheduler } from '@graphorin/triggers';
import { Hono } from 'hono';
import { z } from 'zod';

import type { ServerVariables } from '../internal/context.js';
import { createScopeMiddleware } from '../middleware/scope.js';
import type { TriggersDaemon } from './daemon.js';

/**
 * @stable
 */
export interface TriggersRoutesDeps {
  readonly daemon: TriggersDaemon;
}

/**
 * @stable
 */
export function createTriggersRoutes(
  deps: TriggersRoutesDeps,
): Hono<{ Variables: ServerVariables }> {
  const app = new Hono<{ Variables: ServerVariables }>();
  const scheduler: Scheduler = deps.daemon.scheduler;

  app.get('/', createScopeMiddleware('triggers:read'), async (c) => {
    const all = await scheduler.list();
    return c.json({ triggers: all.map(serializeTrigger) });
  });

  app.get('/:id', createScopeMiddleware('triggers:read'), async (c) => {
    const id = c.req.param('id');
    const all = await scheduler.list();
    const found = all.find((t) => t.id === id);
    if (found === undefined) {
      return c.json({ error: 'not-found', message: `Trigger '${id}' not found.` }, 404);
    }
    return c.json({ trigger: serializeTrigger(found) });
  });

  app.post('/:id/fire', createScopeMiddleware('triggers:fire'), async (c) => {
    const id = c.req.param('id');
    try {
      await scheduler.fire(id);
    } catch (err) {
      return c.json(
        {
          error: 'not-found',
          message: err instanceof Error ? err.message : `Trigger '${id}' not found.`,
        },
        404,
      );
    }
    return c.json({ ok: true, fired: id });
  });

  // IP-17: disable/enable are non-destructive flag flips on the
  // persistent TriggerState (in agreement with the CLI); the
  // destructive removal is DELETE /:id.
  app.post('/:id/disable', createScopeMiddleware('triggers:disable'), async (c) => {
    const id = c.req.param('id');
    try {
      const updated = await scheduler.setDisabled(id, true);
      return c.json({ ok: true, trigger: serializeTrigger(updated) });
    } catch {
      return c.json({ error: 'not-found', message: `Trigger '${id}' not found.` }, 404);
    }
  });

  app.post('/:id/enable', createScopeMiddleware('triggers:disable'), async (c) => {
    const id = c.req.param('id');
    try {
      const updated = await scheduler.setDisabled(id, false);
      return c.json({ ok: true, trigger: serializeTrigger(updated) });
    } catch {
      return c.json({ error: 'not-found', message: `Trigger '${id}' not found.` }, 404);
    }
  });

  app.delete('/:id', createScopeMiddleware('triggers:disable'), async (c) => {
    const id = c.req.param('id');
    const all = await scheduler.list();
    if (!all.some((t) => t.id === id)) {
      return c.json({ error: 'not-found', message: `Trigger '${id}' not found.` }, 404);
    }
    await scheduler.unregister(id);
    return c.json({ ok: true, removed: id });
  });

  app.post('/prune', createScopeMiddleware('triggers:disable'), async (c) => {
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      raw = {};
    }
    const parsed = PruneBodySchema.safeParse(raw ?? {});
    if (!parsed.success) {
      return c.json(
        {
          error: 'bad-request',
          message: `Invalid prune body: expected { disabled?: boolean, orphaned?: boolean }.`,
        },
        400,
      );
    }
    const pruneDisabled = parsed.data.disabled ?? true;
    const pruneOrphaned = parsed.data.orphaned ?? false;

    // W-123: orphans first - a disabled orphan belongs to the orphan
    // bucket, and the second pass never re-sees removed rows.
    const removedOrphaned: string[] = [];
    if (pruneOrphaned) {
      for (const trigger of await scheduler.orphans()) {
        await scheduler.unregister(trigger.id);
        removedOrphaned.push(trigger.id);
      }
    }
    const removedDisabled: string[] = [];
    if (pruneDisabled) {
      for (const trigger of await scheduler.list()) {
        if (trigger.disabled) {
          await scheduler.unregister(trigger.id);
          removedDisabled.push(trigger.id);
        }
      }
    }
    const removed = [...removedOrphaned, ...removedDisabled];
    return c.json({
      ok: true,
      removed,
      count: removed.length,
      disabled: removedDisabled,
      orphaned: removedOrphaned,
    });
  });

  return app;
}

const PruneBodySchema = z
  .object({
    disabled: z.boolean().optional(),
    orphaned: z.boolean().optional(),
  })
  .strict();

function serializeTrigger(state: TriggerState): Record<string, unknown> {
  return {
    id: state.id,
    kind: state.kind,
    spec: state.spec,
    callbackRef: state.callbackRef,
    ...(state.nextFireAt !== undefined ? { nextFireAt: state.nextFireAt } : {}),
    ...(state.lastFiredAt !== undefined ? { lastFiredAt: state.lastFiredAt } : {}),
    missedFires: state.missedFires,
    disabled: state.disabled,
    catchupPolicy: state.catchupPolicy,
    maxCatchupRuns: state.maxCatchupRuns,
    catchupWindowMs: state.catchupWindowMs,
    ...(state.tags !== undefined ? { tags: [...state.tags] } : {}),
    createdAt: state.createdAt,
    ...(state.updatedAt !== undefined ? { updatedAt: state.updatedAt } : {}),
  };
}
