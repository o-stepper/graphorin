[**Graphorin API reference v0.1.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [config](/api/@graphorin/server/config/index.md) / defineConfig

# Function: defineConfig()

```ts
function defineConfig(input): 
  | {
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
           applyToEvents?: string[];
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
}
  | undefined;
```

Defined in: packages/server/src/config.ts:394

Helper for `graphorin.config.ts` files. Pure pass-through that
provides editor autocomplete; the actual parsing happens at server
startup so callers always see the same error path regardless of
which loader (TS / JS / JSON) the operator picked.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \| \{ `audit?`: \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; `path?`: `string`; \}; `auth?`: \{ `kind?`: `"token"` \| `"none"`; `pepperRef?`: `string`; `perIpFailureThreshold?`: `number`; `perIpLockoutMs?`: `number`; `tokenEnvironments?`: `string`[]; `tokenPrefix?`: `string`; \}; `hardening?`: \{ `applyOnStart?`: `boolean`; `refuseRoot?`: `boolean`; `umask?`: `number`; \}; `health?`: \{ `walWarnThresholdBytes?`: `number`; \}; `metrics?`: \{ `enabled?`: `boolean`; `path?`: `string`; `requireAuth?`: `boolean`; \}; `observability?`: \{ `logger?`: `"json"` \| `"pretty"` \| `"silent"`; \}; `secrets?`: \{ `source?`: `"auto"` \| `"keyring"` \| `"encrypted-file"` \| `"env"`; `strict?`: `boolean`; \}; `server?`: \{ `basePath?`: `string`; `cors?`: \{ `allowCredentials?`: `boolean`; `allowHeaders?`: `string`[]; `allowMethods?`: `string`[]; `allowOrigins?`: `string`[]; `maxAgeSeconds?`: `number`; \}; `csrf?`: \{ `cookieName?`: `string`; `enabled?`: `boolean`; `headerName?`: `string`; `safeMethods?`: `string`[]; \}; `host?`: `string`; `idempotency?`: \{ `checkBodyFingerprint?`: `boolean`; `enabled?`: `boolean`; `lruCacheSize?`: `number`; `requireKey?`: `"off"` \| `"warn"` \| `"enforce"`; `ttlSeconds?`: `number`; \}; `port?`: `number`; `rateLimit?`: \{ `enabled?`: `boolean`; `perIpRequests?`: `number`; `windowMs?`: `number`; \}; `shutdown?`: \{ `drainTimeoutMs?`: `number`; \}; `sse?`: \{ `enabled?`: `boolean`; `keepAliveMs?`: `number`; `path?`: `string`; \}; `stream?`: \{ `disconnectGracePeriodMs?`: `number`; `disconnectPolicy?`: `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"`; `perConnectionQueueLimit?`: `number`; `replayBuffer?`: \{ `maxEvents?`: `number`; `ttlSeconds?`: `number`; \}; \}; `trustProxy?`: `boolean`; `ws?`: \{ `commentarySanitization?`: \{ `applyToEvents?`: `string`[]; `policy?`: `"wrap"` \| `"strip"` \| `"pass-through"`; \}; `enabled?`: `boolean`; `path?`: `string`; `ticketTtlMs?`: `number`; \}; \}; `storage?`: \{ `encryption?`: \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; \}; `mode?`: `"lib"` \| `"server"`; `path?`: `string`; `walCheckpointIntervalMs?`: `number`; \}; \} \| `undefined` |

## Returns

  \| \{
  `audit?`: \{
     `cipher?`: `string`;
     `enabled?`: `boolean`;
     `passphraseRef?`: `string`;
     `path?`: `string`;
  \};
  `auth?`: \{
     `kind?`: `"token"` \| `"none"`;
     `pepperRef?`: `string`;
     `perIpFailureThreshold?`: `number`;
     `perIpLockoutMs?`: `number`;
     `tokenEnvironments?`: `string`[];
     `tokenPrefix?`: `string`;
  \};
  `hardening?`: \{
     `applyOnStart?`: `boolean`;
     `refuseRoot?`: `boolean`;
     `umask?`: `number`;
  \};
  `health?`: \{
     `walWarnThresholdBytes?`: `number`;
  \};
  `metrics?`: \{
     `enabled?`: `boolean`;
     `path?`: `string`;
     `requireAuth?`: `boolean`;
  \};
  `observability?`: \{
     `logger?`: `"json"` \| `"pretty"` \| `"silent"`;
  \};
  `secrets?`: \{
     `source?`: `"auto"` \| `"keyring"` \| `"encrypted-file"` \| `"env"`;
     `strict?`: `boolean`;
  \};
  `server?`: \{
     `basePath?`: `string`;
     `cors?`: \{
        `allowCredentials?`: `boolean`;
        `allowHeaders?`: `string`[];
        `allowMethods?`: `string`[];
        `allowOrigins?`: `string`[];
        `maxAgeSeconds?`: `number`;
     \};
     `csrf?`: \{
        `cookieName?`: `string`;
        `enabled?`: `boolean`;
        `headerName?`: `string`;
        `safeMethods?`: `string`[];
     \};
     `host?`: `string`;
     `idempotency?`: \{
        `checkBodyFingerprint?`: `boolean`;
        `enabled?`: `boolean`;
        `lruCacheSize?`: `number`;
        `requireKey?`: `"off"` \| `"warn"` \| `"enforce"`;
        `ttlSeconds?`: `number`;
     \};
     `port?`: `number`;
     `rateLimit?`: \{
        `enabled?`: `boolean`;
        `perIpRequests?`: `number`;
        `windowMs?`: `number`;
     \};
     `shutdown?`: \{
        `drainTimeoutMs?`: `number`;
     \};
     `sse?`: \{
        `enabled?`: `boolean`;
        `keepAliveMs?`: `number`;
        `path?`: `string`;
     \};
     `stream?`: \{
        `disconnectGracePeriodMs?`: `number`;
        `disconnectPolicy?`: `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"`;
        `perConnectionQueueLimit?`: `number`;
        `replayBuffer?`: \{
           `maxEvents?`: `number`;
           `ttlSeconds?`: `number`;
        \};
     \};
     `trustProxy?`: `boolean`;
     `ws?`: \{
        `commentarySanitization?`: \{
           `applyToEvents?`: `string`[];
           `policy?`: `"wrap"` \| `"strip"` \| `"pass-through"`;
        \};
        `enabled?`: `boolean`;
        `path?`: `string`;
        `ticketTtlMs?`: `number`;
     \};
  \};
  `storage?`: \{
     `encryption?`: \{
        `cipher?`: `string`;
        `enabled?`: `boolean`;
        `passphraseRef?`: `string`;
     \};
     `mode?`: `"lib"` \| `"server"`;
     `path?`: `string`;
     `walCheckpointIntervalMs?`: `number`;
  \};
\}
  \| `undefined`

## Stable
