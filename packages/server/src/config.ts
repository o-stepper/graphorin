/**
 * Strongly-typed configuration loader for the Graphorin server.
 *
 * Operators ship a `graphorin.config.ts` (or `.js` / `.mjs` / JSON)
 * file that calls {@link defineConfig} to construct a typed config
 * object; the server runtime accepts either the raw object, a path
 * to such a file, or a function that returns one.
 *
 * Validation is performed via Zod so user-facing errors include the
 * exact path of every failing field, not just a generic
 * "TypeError: undefined".
 *
 * @packageDocumentation
 */

import { z } from 'zod';

import { ConfigInvalidError } from './errors/index.js';

/**
 * String literal that flags a value as a `SecretRef` URI. The
 * server's pre-bind step resolves every `*Ref` field through the
 * `@graphorin/security` resolver registry before binding the
 * listener; an unresolvable ref fails fast with
 * {@link import('./errors/index.js').PrebindSecretUnresolvableError}.
 *
 * @stable
 */
export type SecretRefString = string;

/**
 * Selector for which `SecretsStore` flavour the server activates.
 * Mirrors `--secrets-source` from DEC-136.
 *
 * @stable
 */
export type SecretsSource = 'auto' | 'keyring' | 'encrypted-file' | 'env';

/** @stable */
export type IdempotencyRequireKeyMode = 'off' | 'warn' | 'enforce';

/** @stable */
export type DeliveryCommentaryPolicyConfig = 'wrap' | 'strip' | 'pass-through';

/** @stable */
export interface ServerConfigSpec {
  readonly server: {
    readonly host: string;
    readonly port: number;
    readonly basePath: string;
    readonly cors: {
      readonly allowOrigins: ReadonlyArray<string>;
      readonly allowCredentials: boolean;
      readonly allowMethods: ReadonlyArray<string>;
      readonly allowHeaders: ReadonlyArray<string>;
      readonly maxAgeSeconds: number;
    };
    readonly csrf: {
      readonly enabled: boolean;
      readonly cookieName: string;
      readonly headerName: string;
      readonly safeMethods: ReadonlyArray<string>;
    };
    readonly rateLimit: {
      readonly enabled: boolean;
      readonly windowMs: number;
      readonly perIpRequests: number;
    };
    readonly idempotency: {
      readonly enabled: boolean;
      readonly requireKey: IdempotencyRequireKeyMode;
      readonly ttlSeconds: number;
      readonly checkBodyFingerprint: boolean;
      readonly lruCacheSize: number;
    };
    readonly shutdown: {
      readonly drainTimeoutMs: number;
    };
    readonly trustProxy: boolean;
    readonly stream: {
      readonly disconnectPolicy: 'continue' | 'pause-on-disconnect' | 'abort-on-disconnect';
      readonly disconnectGracePeriodMs: number;
      readonly replayBuffer: {
        readonly maxEvents: number;
        readonly ttlSeconds: number;
        readonly pruneIntervalSeconds: number;
      };
      readonly perConnectionQueueLimit: number;
    };
    readonly ws: {
      readonly enabled: boolean;
      readonly path: string;
      readonly ticketTtlMs: number;
      readonly commentarySanitization: {
        readonly policy: DeliveryCommentaryPolicyConfig;
        readonly applyToEvents: ReadonlyArray<string>;
      };
    };
    readonly sse: {
      readonly enabled: boolean;
      readonly path: string;
      readonly keepAliveMs: number;
    };
  };
  readonly storage: {
    readonly path: string;
    readonly mode: 'lib' | 'server';
    readonly walCheckpointIntervalMs?: number;
    readonly encryption: {
      readonly enabled: boolean;
      readonly cipher?: string;
      readonly passphraseRef?: SecretRefString;
    };
  };
  readonly audit: {
    readonly enabled: boolean;
    readonly path?: string;
    readonly passphraseRef?: SecretRefString;
    readonly cipher?: string;
  };
  readonly secrets: {
    readonly source: SecretsSource;
    readonly strict: boolean;
  };
  readonly auth: {
    readonly kind: 'token' | 'none';
    readonly pepperRef?: SecretRefString;
    readonly tokenPrefix: string;
    readonly tokenEnvironments: ReadonlyArray<string>;
    readonly perIpFailureThreshold?: number;
    readonly perIpLockoutMs?: number;
  };
  readonly observability: {
    readonly logger: 'json' | 'pretty' | 'silent';
  };
  readonly hardening: {
    readonly applyOnStart: boolean;
    readonly refuseRoot: boolean;
    readonly umask: number;
  };
  readonly metrics: {
    readonly enabled: boolean;
    readonly path: string;
    readonly requireAuth: boolean;
  };
  readonly health: {
    readonly walWarnThresholdBytes: number;
  };
}

const corsSchema = z
  .object({
    allowOrigins: z.array(z.string()).default([]),
    allowCredentials: z.boolean().default(false),
    allowMethods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']),
    allowHeaders: z
      .array(z.string())
      .default(['Authorization', 'Content-Type', 'Idempotency-Key', 'X-CSRF-Token']),
    maxAgeSeconds: z.number().int().nonnegative().default(600),
  })
  .strict()
  .default({});

const csrfSchema = z
  .object({
    enabled: z.boolean().default(true),
    cookieName: z.string().default('graphorin_csrf'),
    headerName: z.string().default('X-CSRF-Token'),
    safeMethods: z.array(z.string()).default(['GET', 'HEAD', 'OPTIONS']),
  })
  .strict()
  .default({});

const rateLimitSchema = z
  .object({
    enabled: z.boolean().default(true),
    windowMs: z.number().int().positive().default(60_000),
    perIpRequests: z.number().int().positive().default(60),
  })
  .strict()
  .default({});

const idempotencySchema = z
  .object({
    enabled: z.boolean().default(true),
    requireKey: z.enum(['off', 'warn', 'enforce']).default('warn'),
    ttlSeconds: z.number().int().positive().default(86_400),
    checkBodyFingerprint: z.boolean().default(true),
    lruCacheSize: z.number().int().positive().default(1_000),
  })
  .strict()
  .default({});

const shutdownSchema = z
  .object({
    drainTimeoutMs: z.number().int().positive().default(30_000),
  })
  .strict()
  .default({});

const streamReplayBufferSchema = z
  .object({
    maxEvents: z.number().int().positive().default(1_000),
    ttlSeconds: z.number().int().positive().default(300),
    // W-028: interval of the periodic TTL sweep that releases
    // finished-run subjects with no further push/replay activity.
    pruneIntervalSeconds: z.number().int().positive().default(60),
  })
  .strict()
  .default({});

const streamSchema = z
  .object({
    disconnectPolicy: z
      .enum(['continue', 'pause-on-disconnect', 'abort-on-disconnect'])
      .default('continue'),
    disconnectGracePeriodMs: z.number().int().nonnegative().default(10_000),
    replayBuffer: streamReplayBufferSchema,
    perConnectionQueueLimit: z.number().int().positive().default(1_000),
  })
  .strict()
  .default({});

const wsCommentarySchema = z
  .object({
    policy: z.enum(['wrap', 'strip', 'pass-through']).default('wrap'),
    applyToEvents: z
      .array(z.string().min(1))
      .default(['tool.execute.end', 'tool.execute.error', 'text.delta']),
  })
  .strict()
  .default({});

const wsSchema = z
  .object({
    enabled: z.boolean().default(true),
    path: z.string().default('/ws'),
    ticketTtlMs: z
      .number()
      .int()
      .positive()
      .default(5 * 60_000),
    commentarySanitization: wsCommentarySchema,
  })
  .strict()
  .default({});

const sseSchema = z
  .object({
    enabled: z.boolean().default(true),
    path: z.string().default('/sessions'),
    keepAliveMs: z.number().int().positive().default(15_000),
  })
  .strict()
  .default({});

const serverSchema = z
  .object({
    host: z.string().min(1).default('127.0.0.1'),
    port: z.number().int().min(0).max(65_535).default(8_080),
    basePath: z.string().default('/v1'),
    cors: corsSchema,
    csrf: csrfSchema,
    rateLimit: rateLimitSchema,
    idempotency: idempotencySchema,
    shutdown: shutdownSchema,
    trustProxy: z.boolean().default(false),
    stream: streamSchema,
    ws: wsSchema,
    sse: sseSchema,
  })
  .strict()
  .default({});

const encryptionSchema = z
  .object({
    enabled: z.boolean().default(false),
    cipher: z.string().optional(),
    passphraseRef: z.string().optional(),
  })
  .strict()
  .default({});

const storageSchema = z
  .object({
    path: z.string().min(1).default('./.graphorin/data.db'),
    mode: z.enum(['lib', 'server']).default('server'),
    walCheckpointIntervalMs: z.number().int().positive().optional(),
    encryption: encryptionSchema,
  })
  .strict()
  .default({});

const auditSchema = z
  .object({
    enabled: z.boolean().default(false),
    path: z.string().optional(),
    passphraseRef: z.string().optional(),
    cipher: z.string().optional(),
  })
  .strict()
  .default({});

const secretsSchema = z
  .object({
    source: z.enum(['auto', 'keyring', 'encrypted-file', 'env']).default('auto'),
    strict: z.boolean().default(false),
  })
  .strict()
  .default({});

const authSchema = z
  .object({
    kind: z.enum(['token', 'none']).default('token'),
    pepperRef: z.string().optional(),
    tokenPrefix: z.string().default('gph'),
    tokenEnvironments: z.array(z.string()).default(['live', 'test', 'local']),
    perIpFailureThreshold: z.number().int().positive().optional(),
    perIpLockoutMs: z.number().int().positive().optional(),
  })
  .strict()
  .default({});

const observabilitySchema = z
  .object({
    logger: z.enum(['json', 'pretty', 'silent']).default('json'),
  })
  .strict()
  .default({});

const hardeningSchema = z
  .object({
    applyOnStart: z.boolean().default(true),
    refuseRoot: z.boolean().default(true),
    umask: z.number().int().nonnegative().default(0o077),
  })
  .strict()
  .default({});

const metricsSchema = z
  .object({
    enabled: z.boolean().default(true),
    path: z.string().default('/metrics'),
    requireAuth: z.boolean().default(false),
  })
  .strict()
  .default({});

const healthSchema = z
  .object({
    walWarnThresholdBytes: z
      .number()
      .int()
      .positive()
      .default(50 * 1024 * 1024),
  })
  .strict()
  .default({});

/**
 * Zod schema for the resolved {@link ServerConfigSpec}. Exposed for
 * advanced users that want to validate other config sources (env-only
 * launch, CLI overrides, etc.).
 *
 * @stable
 */
export const ServerConfigSchema = z
  .object({
    server: serverSchema,
    storage: storageSchema,
    audit: auditSchema,
    secrets: secretsSchema,
    auth: authSchema,
    observability: observabilitySchema,
    hardening: hardeningSchema,
    metrics: metricsSchema,
    health: healthSchema,
  })
  .strict()
  .default({});

/**
 * Input shape accepted by {@link defineConfig}. Every field is
 * optional; missing values fall back to a documented default.
 *
 * @stable
 */
export type ServerConfigInput = z.input<typeof ServerConfigSchema>;

/**
 * Helper for `graphorin.config.ts` files. Pure pass-through that
 * provides editor autocomplete; the actual parsing happens at server
 * startup so callers always see the same error path regardless of
 * which loader (TS / JS / JSON) the operator picked.
 *
 * @stable
 */
export function defineConfig(input: ServerConfigInput): ServerConfigInput {
  return input;
}

/**
 * Parse + validate user input. Returns a strongly-typed
 * {@link ServerConfigSpec}; throws {@link ConfigInvalidError} on
 * any invalid field with a flattened issue list.
 *
 * @stable
 */
export function parseServerConfig(input: unknown): ServerConfigSpec {
  const result = ServerConfigSchema.safeParse(input ?? {});
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path,
      message: issue.message,
    }));
    throw new ConfigInvalidError(issues, result.error);
  }
  return result.data as unknown as ServerConfigSpec;
}
