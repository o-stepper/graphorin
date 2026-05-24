[**Graphorin API reference v0.3.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [config](/api/@graphorin/server/config/index.md) / ServerConfigSchema

# Variable: ServerConfigSchema

```ts
const ServerConfigSchema: ZodDefault<ZodObject<{
  audit: ZodDefault<ZodObject<{
     cipher: ZodOptional<ZodString>;
     enabled: ZodDefault<ZodBoolean>;
     passphraseRef: ZodOptional<ZodString>;
     path: ZodOptional<ZodString>;
   }, "strict", ZodTypeAny, {
     cipher?: string;
     enabled: boolean;
     passphraseRef?: string;
     path?: string;
   }, {
     cipher?: string;
     enabled?: boolean;
     passphraseRef?: string;
     path?: string;
  }>>;
  auth: ZodDefault<ZodObject<{
     kind: ZodDefault<ZodEnum<["token", "none"]>>;
     pepperRef: ZodOptional<ZodString>;
     perIpFailureThreshold: ZodOptional<ZodNumber>;
     perIpLockoutMs: ZodOptional<ZodNumber>;
     tokenEnvironments: ZodDefault<ZodArray<ZodString, "many">>;
     tokenPrefix: ZodDefault<ZodString>;
   }, "strict", ZodTypeAny, {
     kind: "token" | "none";
     pepperRef?: string;
     perIpFailureThreshold?: number;
     perIpLockoutMs?: number;
     tokenEnvironments: string[];
     tokenPrefix: string;
   }, {
     kind?: "token" | "none";
     pepperRef?: string;
     perIpFailureThreshold?: number;
     perIpLockoutMs?: number;
     tokenEnvironments?: string[];
     tokenPrefix?: string;
  }>>;
  hardening: ZodDefault<ZodObject<{
     applyOnStart: ZodDefault<ZodBoolean>;
     refuseRoot: ZodDefault<ZodBoolean>;
     umask: ZodDefault<ZodNumber>;
   }, "strict", ZodTypeAny, {
     applyOnStart: boolean;
     refuseRoot: boolean;
     umask: number;
   }, {
     applyOnStart?: boolean;
     refuseRoot?: boolean;
     umask?: number;
  }>>;
  health: ZodDefault<ZodObject<{
     walWarnThresholdBytes: ZodDefault<ZodNumber>;
   }, "strict", ZodTypeAny, {
     walWarnThresholdBytes: number;
   }, {
     walWarnThresholdBytes?: number;
  }>>;
  metrics: ZodDefault<ZodObject<{
     enabled: ZodDefault<ZodBoolean>;
     path: ZodDefault<ZodString>;
     requireAuth: ZodDefault<ZodBoolean>;
   }, "strict", ZodTypeAny, {
     enabled: boolean;
     path: string;
     requireAuth: boolean;
   }, {
     enabled?: boolean;
     path?: string;
     requireAuth?: boolean;
  }>>;
  observability: ZodDefault<ZodObject<{
     logger: ZodDefault<ZodEnum<["json", "pretty", "silent"]>>;
   }, "strict", ZodTypeAny, {
     logger: "json" | "pretty" | "silent";
   }, {
     logger?: "json" | "pretty" | "silent";
  }>>;
  secrets: ZodDefault<ZodObject<{
     source: ZodDefault<ZodEnum<["auto", "keyring", "encrypted-file", "env"]>>;
     strict: ZodDefault<ZodBoolean>;
   }, "strict", ZodTypeAny, {
     source: "auto" | "keyring" | "encrypted-file" | "env";
     strict: boolean;
   }, {
     source?: "auto" | "keyring" | "encrypted-file" | "env";
     strict?: boolean;
  }>>;
  server: ZodDefault<ZodObject<{
     basePath: ZodDefault<ZodString>;
     cors: ZodDefault<ZodObject<{
        allowCredentials: ZodDefault<ZodBoolean>;
        allowHeaders: ZodDefault<ZodArray<..., ...>>;
        allowMethods: ZodDefault<ZodArray<..., ...>>;
        allowOrigins: ZodDefault<ZodArray<..., ...>>;
        maxAgeSeconds: ZodDefault<ZodNumber>;
      }, "strict", ZodTypeAny, {
        allowCredentials: boolean;
        allowHeaders: string[];
        allowMethods: string[];
        allowOrigins: string[];
        maxAgeSeconds: number;
      }, {
        allowCredentials?: boolean;
        allowHeaders?: ...[];
        allowMethods?: ...[];
        allowOrigins?: ...[];
        maxAgeSeconds?: number;
     }>>;
     csrf: ZodDefault<ZodObject<{
        cookieName: ZodDefault<ZodString>;
        enabled: ZodDefault<ZodBoolean>;
        headerName: ZodDefault<ZodString>;
        safeMethods: ZodDefault<ZodArray<..., ...>>;
      }, "strict", ZodTypeAny, {
        cookieName: string;
        enabled: boolean;
        headerName: string;
        safeMethods: string[];
      }, {
        cookieName?: string;
        enabled?: boolean;
        headerName?: string;
        safeMethods?: ...[];
     }>>;
     host: ZodDefault<ZodString>;
     idempotency: ZodDefault<ZodObject<{
        checkBodyFingerprint: ZodDefault<ZodBoolean>;
        enabled: ZodDefault<ZodBoolean>;
        lruCacheSize: ZodDefault<ZodNumber>;
        requireKey: ZodDefault<ZodEnum<...>>;
        ttlSeconds: ZodDefault<ZodNumber>;
      }, "strict", ZodTypeAny, {
        checkBodyFingerprint: boolean;
        enabled: boolean;
        lruCacheSize: number;
        requireKey: "off" | "warn" | "enforce";
        ttlSeconds: number;
      }, {
        checkBodyFingerprint?: boolean;
        enabled?: boolean;
        lruCacheSize?: number;
        requireKey?: "off" | "warn" | "enforce";
        ttlSeconds?: number;
     }>>;
     port: ZodDefault<ZodNumber>;
     rateLimit: ZodDefault<ZodObject<{
        enabled: ZodDefault<ZodBoolean>;
        perIpRequests: ZodDefault<ZodNumber>;
        windowMs: ZodDefault<ZodNumber>;
      }, "strict", ZodTypeAny, {
        enabled: boolean;
        perIpRequests: number;
        windowMs: number;
      }, {
        enabled?: boolean;
        perIpRequests?: number;
        windowMs?: number;
     }>>;
     shutdown: ZodDefault<ZodObject<{
        drainTimeoutMs: ZodDefault<ZodNumber>;
      }, "strict", ZodTypeAny, {
        drainTimeoutMs: number;
      }, {
        drainTimeoutMs?: number;
     }>>;
     sse: ZodDefault<ZodObject<{
        enabled: ZodDefault<ZodBoolean>;
        keepAliveMs: ZodDefault<ZodNumber>;
        path: ZodDefault<ZodString>;
      }, "strict", ZodTypeAny, {
        enabled: boolean;
        keepAliveMs: number;
        path: string;
      }, {
        enabled?: boolean;
        keepAliveMs?: number;
        path?: string;
     }>>;
     stream: ZodDefault<ZodObject<{
        disconnectGracePeriodMs: ZodDefault<ZodNumber>;
        disconnectPolicy: ZodDefault<ZodEnum<...>>;
        perConnectionQueueLimit: ZodDefault<ZodNumber>;
        replayBuffer: ZodDefault<ZodObject<..., ..., ..., ..., ...>>;
      }, "strict", ZodTypeAny, {
        disconnectGracePeriodMs: number;
        disconnectPolicy: "continue" | "pause-on-disconnect" | "abort-on-disconnect";
        perConnectionQueueLimit: number;
        replayBuffer: {
           maxEvents: number;
           ttlSeconds: number;
        };
      }, {
        disconnectGracePeriodMs?: number;
        disconnectPolicy?: "continue" | "pause-on-disconnect" | "abort-on-disconnect";
        perConnectionQueueLimit?: number;
        replayBuffer?: {
           maxEvents?: ...;
           ttlSeconds?: ...;
        };
     }>>;
     trustProxy: ZodDefault<ZodBoolean>;
     ws: ZodDefault<ZodObject<{
        commentarySanitization: ZodDefault<ZodObject<..., ..., ..., ..., ...>>;
        enabled: ZodDefault<ZodBoolean>;
        path: ZodDefault<ZodString>;
        ticketTtlMs: ZodDefault<ZodNumber>;
      }, "strict", ZodTypeAny, {
        commentarySanitization: {
           applyToEvents: ...[];
           policy: ... | ... | ...;
        };
        enabled: boolean;
        path: string;
        ticketTtlMs: number;
      }, {
        commentarySanitization?: {
           applyToEvents?: ...;
           policy?: ...;
        };
        enabled?: boolean;
        path?: string;
        ticketTtlMs?: number;
     }>>;
   }, "strict", ZodTypeAny, {
     basePath: string;
     cors: {
        allowCredentials: boolean;
        allowHeaders: string[];
        allowMethods: string[];
        allowOrigins: string[];
        maxAgeSeconds: number;
     };
     csrf: {
        cookieName: string;
        enabled: boolean;
        headerName: string;
        safeMethods: string[];
     };
     host: string;
     idempotency: {
        checkBodyFingerprint: boolean;
        enabled: boolean;
        lruCacheSize: number;
        requireKey: "off" | "warn" | "enforce";
        ttlSeconds: number;
     };
     port: number;
     rateLimit: {
        enabled: boolean;
        perIpRequests: number;
        windowMs: number;
     };
     shutdown: {
        drainTimeoutMs: number;
     };
     sse: {
        enabled: boolean;
        keepAliveMs: number;
        path: string;
     };
     stream: {
        disconnectGracePeriodMs: number;
        disconnectPolicy: "continue" | "pause-on-disconnect" | "abort-on-disconnect";
        perConnectionQueueLimit: number;
        replayBuffer: {
           maxEvents: number;
           ttlSeconds: number;
        };
     };
     trustProxy: boolean;
     ws: {
        commentarySanitization: {
           applyToEvents: string[];
           policy: "wrap" | "strip" | "pass-through";
        };
        enabled: boolean;
        path: string;
        ticketTtlMs: number;
     };
   }, {
     basePath?: string;
     cors?: {
        allowCredentials?: boolean;
        allowHeaders?: string[];
        allowMethods?: string[];
        allowOrigins?: string[];
        maxAgeSeconds?: number;
     };
     csrf?: {
        cookieName?: string;
        enabled?: boolean;
        headerName?: string;
        safeMethods?: string[];
     };
     host?: string;
     idempotency?: {
        checkBodyFingerprint?: boolean;
        enabled?: boolean;
        lruCacheSize?: number;
        requireKey?: "off" | "warn" | "enforce";
        ttlSeconds?: number;
     };
     port?: number;
     rateLimit?: {
        enabled?: boolean;
        perIpRequests?: number;
        windowMs?: number;
     };
     shutdown?: {
        drainTimeoutMs?: number;
     };
     sse?: {
        enabled?: boolean;
        keepAliveMs?: number;
        path?: string;
     };
     stream?: {
        disconnectGracePeriodMs?: number;
        disconnectPolicy?: "continue" | "pause-on-disconnect" | "abort-on-disconnect";
        perConnectionQueueLimit?: number;
        replayBuffer?: {
           maxEvents?: ... | ...;
           ttlSeconds?: ... | ...;
        };
     };
     trustProxy?: boolean;
     ws?: {
        commentarySanitization?: {
           applyToEvents?: ... | ...;
           policy?: ... | ... | ... | ...;
        };
        enabled?: boolean;
        path?: string;
        ticketTtlMs?: number;
     };
  }>>;
  storage: ZodDefault<ZodObject<{
     encryption: ZodDefault<ZodObject<{
        cipher: ZodOptional<ZodString>;
        enabled: ZodDefault<ZodBoolean>;
        passphraseRef: ZodOptional<ZodString>;
      }, "strict", ZodTypeAny, {
        cipher?: string;
        enabled: boolean;
        passphraseRef?: string;
      }, {
        cipher?: string;
        enabled?: boolean;
        passphraseRef?: string;
     }>>;
     mode: ZodDefault<ZodEnum<["lib", "server"]>>;
     path: ZodDefault<ZodString>;
     walCheckpointIntervalMs: ZodOptional<ZodNumber>;
   }, "strict", ZodTypeAny, {
     encryption: {
        cipher?: string;
        enabled: boolean;
        passphraseRef?: string;
     };
     mode: "lib" | "server";
     path: string;
     walCheckpointIntervalMs?: number;
   }, {
     encryption?: {
        cipher?: string;
        enabled?: boolean;
        passphraseRef?: string;
     };
     mode?: "lib" | "server";
     path?: string;
     walCheckpointIntervalMs?: number;
  }>>;
}, "strict", ZodTypeAny, {
  audit: {
     cipher?: string;
     enabled: boolean;
     passphraseRef?: string;
     path?: string;
  };
  auth: {
     kind: "token" | "none";
     pepperRef?: string;
     perIpFailureThreshold?: number;
     perIpLockoutMs?: number;
     tokenEnvironments: string[];
     tokenPrefix: string;
  };
  hardening: {
     applyOnStart: boolean;
     refuseRoot: boolean;
     umask: number;
  };
  health: {
     walWarnThresholdBytes: number;
  };
  metrics: {
     enabled: boolean;
     path: string;
     requireAuth: boolean;
  };
  observability: {
     logger: "json" | "pretty" | "silent";
  };
  secrets: {
     source: "auto" | "keyring" | "encrypted-file" | "env";
     strict: boolean;
  };
  server: {
     basePath: string;
     cors: {
        allowCredentials: boolean;
        allowHeaders: string[];
        allowMethods: string[];
        allowOrigins: string[];
        maxAgeSeconds: number;
     };
     csrf: {
        cookieName: string;
        enabled: boolean;
        headerName: string;
        safeMethods: string[];
     };
     host: string;
     idempotency: {
        checkBodyFingerprint: boolean;
        enabled: boolean;
        lruCacheSize: number;
        requireKey: "off" | "warn" | "enforce";
        ttlSeconds: number;
     };
     port: number;
     rateLimit: {
        enabled: boolean;
        perIpRequests: number;
        windowMs: number;
     };
     shutdown: {
        drainTimeoutMs: number;
     };
     sse: {
        enabled: boolean;
        keepAliveMs: number;
        path: string;
     };
     stream: {
        disconnectGracePeriodMs: number;
        disconnectPolicy: "continue" | "pause-on-disconnect" | "abort-on-disconnect";
        perConnectionQueueLimit: number;
        replayBuffer: {
           maxEvents: number;
           ttlSeconds: number;
        };
     };
     trustProxy: boolean;
     ws: {
        commentarySanitization: {
           applyToEvents: string[];
           policy: "wrap" | "strip" | "pass-through";
        };
        enabled: boolean;
        path: string;
        ticketTtlMs: number;
     };
  };
  storage: {
     encryption: {
        cipher?: string;
        enabled: boolean;
        passphraseRef?: string;
     };
     mode: "lib" | "server";
     path: string;
     walCheckpointIntervalMs?: number;
  };
}, {
  audit?: {
     cipher?: string;
     enabled?: boolean;
     passphraseRef?: string;
     path?: string;
  };
  auth?: {
     kind?: "token" | "none";
     pepperRef?: string;
     perIpFailureThreshold?: number;
     perIpLockoutMs?: number;
     tokenEnvironments?: string[];
     tokenPrefix?: string;
  };
  hardening?: {
     applyOnStart?: boolean;
     refuseRoot?: boolean;
     umask?: number;
  };
  health?: {
     walWarnThresholdBytes?: number;
  };
  metrics?: {
     enabled?: boolean;
     path?: string;
     requireAuth?: boolean;
  };
  observability?: {
     logger?: "json" | "pretty" | "silent";
  };
  secrets?: {
     source?: "auto" | "keyring" | "encrypted-file" | "env";
     strict?: boolean;
  };
  server?: {
     basePath?: string;
     cors?: {
        allowCredentials?: boolean;
        allowHeaders?: string[];
        allowMethods?: string[];
        allowOrigins?: string[];
        maxAgeSeconds?: number;
     };
     csrf?: {
        cookieName?: string;
        enabled?: boolean;
        headerName?: string;
        safeMethods?: string[];
     };
     host?: string;
     idempotency?: {
        checkBodyFingerprint?: boolean;
        enabled?: boolean;
        lruCacheSize?: number;
        requireKey?: "off" | "warn" | "enforce";
        ttlSeconds?: number;
     };
     port?: number;
     rateLimit?: {
        enabled?: boolean;
        perIpRequests?: number;
        windowMs?: number;
     };
     shutdown?: {
        drainTimeoutMs?: number;
     };
     sse?: {
        enabled?: boolean;
        keepAliveMs?: number;
        path?: string;
     };
     stream?: {
        disconnectGracePeriodMs?: number;
        disconnectPolicy?: "continue" | "pause-on-disconnect" | "abort-on-disconnect";
        perConnectionQueueLimit?: number;
        replayBuffer?: {
           maxEvents?: number;
           ttlSeconds?: number;
        };
     };
     trustProxy?: boolean;
     ws?: {
        commentarySanitization?: {
           applyToEvents?: ...[];
           policy?: "wrap" | "strip" | "pass-through";
        };
        enabled?: boolean;
        path?: string;
        ticketTtlMs?: number;
     };
  };
  storage?: {
     encryption?: {
        cipher?: string;
        enabled?: boolean;
        passphraseRef?: string;
     };
     mode?: "lib" | "server";
     path?: string;
     walCheckpointIntervalMs?: number;
  };
}>>;
```

Defined in: packages/server/src/config.ts:363

Zod schema for the resolved [ServerConfigSpec](/api/@graphorin/server/config/interfaces/ServerConfigSpec.md). Exposed for
advanced users that want to validate other config sources (env-only
launch, CLI overrides, etc.).

## Stable
