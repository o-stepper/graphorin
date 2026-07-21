/**
 * Skill REST routes.
 *
 *   GET    /skills                     (scope `skills:read`)
 *   POST   /skills/install             (idempotent; scope `skills:install`)
 *   GET    /skills/:name               (scope `skills:read`)
 *
 * @packageDocumentation
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { ServerVariables } from '../internal/context.js';
import { INVALID_JSON_BODY, readJsonBody } from '../internal/json.js';
import { createScopeMiddleware } from '../middleware/scope.js';

/**
 * @stable
 */
export interface SkillsApi {
  list(): Promise<ReadonlyArray<{ readonly name: string; readonly version?: string }>>;
  get(name: string): Promise<unknown | null>;
  install(input: {
    readonly source: string;
    readonly trust?: 'verified' | 'unverified';
  }): Promise<unknown>;
}

const InstallBodySchema = z
  .object({
    source: z.string().min(1),
    trust: z.enum(['verified', 'unverified']).optional(),
  })
  .strict();

/**
 * @stable
 */
export interface SkillsRoutesDeps {
  readonly skills: SkillsApi;
}

/**
 * @stable
 */
export function createSkillsRoutes(deps: SkillsRoutesDeps): Hono<{ Variables: ServerVariables }> {
  const app = new Hono<{ Variables: ServerVariables }>();

  app.get('/', createScopeMiddleware('skills:read'), async (c) => {
    return c.json({ skills: await deps.skills.list() });
  });

  app.get('/:name', createScopeMiddleware('skills:read'), async (c) => {
    const name = c.req.param('name');
    const skill = await deps.skills.get(name);
    if (skill === null)
      return c.json({ error: 'skill-not-found', message: `Skill '${name}' not found.` }, 404);
    return c.json({ skill });
  });

  app.post('/install', createScopeMiddleware('skills:install'), async (c) => {
    const raw = await readJsonBody(c);
    if (raw === INVALID_JSON_BODY) {
      return c.json({ error: 'invalid-json', message: 'Request body is not valid JSON.' }, 400);
    }
    const parsed = InstallBodySchema.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        {
          error: 'config-invalid',
          message: 'Invalid install body.',
          issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
        },
        400,
      );
    }
    const installInput: { source: string; trust?: 'verified' | 'unverified' } = {
      source: parsed.data.source,
    };
    if (parsed.data.trust !== undefined) installInput.trust = parsed.data.trust;
    const out = await deps.skills.install(installInput);
    return c.json({ skill: out }, 201);
  });

  return app;
}
