/**
 * Token-management REST routes. The handlers wrap the
 * `@graphorin/security/auth` CRUD library functions so the operator
 * can mint / list / revoke tokens through the same API surface as
 * `graphorin token` (Phase 15).
 *
 * @packageDocumentation
 */

import type { AuthTokenStore } from '@graphorin/core/contracts';
import { createToken, listTokens, revokeToken, type SecretValue } from '@graphorin/security';
import { scopeSetMatches, tryParseScope, validateScopeSet } from '@graphorin/security/auth';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { z } from 'zod';

import type { ServerVariables } from '../internal/context.js';
import { createScopeMiddleware } from '../middleware/scope.js';

/**
 * @stable
 */
export interface TokensRoutesDeps {
  readonly tokenStore: AuthTokenStore;
  readonly pepper: SecretValue;
  readonly defaultEnv: string;
  readonly allowedEnvs: ReadonlyArray<string>;
  /**
   * TOKENS-RE-01 / SPL-9: the live token verifier, so a REST revoke
   * invalidates its LRU entry immediately - otherwise a just-used token
   * keeps authenticating from the cache for up to `cacheTtlMaxMs` (60s).
   */
  readonly verifier?: { invalidate(rawTokenOrHashHex: string): void };
}

const CreateBodySchema = z
  .object({
    label: z.string().min(1).optional(),
    scopes: z.array(z.string().min(3)).min(1),
    env: z.string().min(1).optional(),
    expiresInMs: z.number().int().positive().optional(),
  })
  .strict();

/**
 * @stable
 */
export function createTokensRoutes(deps: TokensRoutesDeps): Hono<{ Variables: ServerVariables }> {
  const app = new Hono<{ Variables: ServerVariables }>();

  app.get('/', createScopeMiddleware('tokens:list'), async (c) => {
    const records = await listTokens(deps.tokenStore);
    // Never reveal hashes or pepper-derived material.
    const sanitized = records.map((r) => ({
      id: r.id,
      label: r.label,
      scopes: r.scopes,
      createdAt: r.createdAt,
      lastUsedAt: r.lastUsedAt,
      expiresAt: r.expiresAt,
      revokedAt: r.revokedAt,
    }));
    return c.json({ tokens: sanitized });
  });

  app.post('/', createScopeMiddleware('tokens:create'), async (c) => {
    const parsed = CreateBodySchema.safeParse(await safelyParseJson(c));
    if (!parsed.success) {
      return c.json(
        {
          error: 'config-invalid',
          message: 'Invalid create-token body.',
          issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
        },
        400,
      );
    }
    const env = parsed.data.env ?? deps.defaultEnv;
    if (!deps.allowedEnvs.includes(env)) {
      return c.json(
        {
          error: 'config-invalid',
          message: `Environment '${env}' is not in the allowed set.`,
          allowed: deps.allowedEnvs,
        },
        400,
      );
    }
    // W-106: reject syntactically-invalid scopes up front - the old
    // z.string().min(3) accepted garbage that would grant nothing.
    const syntaxErrors = validateScopeSet(parsed.data.scopes);
    if (syntaxErrors.length > 0) {
      return c.json(
        {
          error: 'config-invalid',
          message: 'One or more requested scopes are syntactically invalid.',
          issues: syntaxErrors.map((e) => ({ message: e.message })),
        },
        400,
      );
    }
    // W-106: attenuation-only minting. A token principal can only mint
    // scopes its OWN grant already covers - `tokens:create` alone must
    // not transitively zero-out the least-privilege catalogue by minting
    // `admin:*`. Delegation chains therefore narrow monotonically (the
    // child's `tokens:create` must itself be covered). The anonymous
    // principal (IP-13 trusted loopback operator, auth disabled) is
    // exempt: it already holds `admin:*`.
    const auth = c.get('state').auth;
    if (auth.kind === 'token') {
      const denied = parsed.data.scopes.filter((requested) => {
        const requestedParsed = tryParseScope(requested);
        if (requestedParsed === undefined) return true;
        return !scopeSetMatches(auth.grantedScopes, requestedParsed);
      });
      if (denied.length > 0) {
        return c.json(
          {
            error: 'scope-escalation-denied',
            message:
              'Attenuation-only minting: a token may only mint scopes covered by its own grant.',
            denied,
          },
          403,
        );
      }
    }
    const created = await createToken({
      tokenStore: deps.tokenStore,
      pepper: deps.pepper,
      env,
      scopes: parsed.data.scopes,
      ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
      ...(parsed.data.expiresInMs !== undefined ? { expiresInMs: parsed.data.expiresInMs } : {}),
    });
    // Reveal the raw token exactly once - at creation.
    const raw = await created.raw.use((value) => value);
    return c.json(
      {
        token: {
          id: created.record.id,
          label: created.record.label,
          scopes: created.record.scopes,
          createdAt: created.record.createdAt,
          expiresAt: created.record.expiresAt,
        },
        raw,
        warning: 'Store this raw value securely; it is shown exactly once.',
      },
      201,
    );
  });

  app.delete('/:id', createScopeMiddleware('tokens:revoke'), async (c) => {
    const id = c.req.param('id');
    const updated = await revokeToken(
      deps.tokenStore,
      id,
      deps.verifier !== undefined ? { verifier: deps.verifier } : {},
    );
    if (updated === undefined) {
      return c.json({ error: 'token-not-found', message: `Token '${id}' not found.` }, 404);
    }
    return c.body(null, 204);
  });

  return app;
}

async function safelyParseJson(c: Context<{ Variables: ServerVariables }>): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}
