[**Graphorin API reference v0.10.0**](../../../../index.md)

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
     toolEvents?: "all" | "off" | "security";
  };
  auth?: {
     kind?: "none" | "token";
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
  retention?: {
     auditDays?: number;
     consolidatorRunsDays?: number;
     dlqExhaustedDays?: number;
     enabled?: boolean;
     idempotency?: boolean;
     intervalMs?: number;
     memoryHistoryDays?: number;
     sessionsClosedOnly?: boolean;
     sessionsDays?: number;
     spansDays?: number;
     workflowThreadsDays?: number;
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
           pruneIntervalSeconds?: number;
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
     mode?: "server" | "lib";
     path?: string;
     walCheckpointIntervalMs?: number;
  };
}
  | undefined;
```

Defined in: [packages/server/src/config.ts:451](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/config.ts#L451)

Helper for `graphorin.config.ts` files. Pure pass-through that
provides editor autocomplete; the actual parsing happens at server
startup so callers always see the same error path regardless of
which loader (TS / JS / JSON) the operator picked.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \| \{ `audit?`: \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; `path?`: `string`; `toolEvents?`: `"all"` \| `"off"` \| `"security"`; \}; `auth?`: \{ `kind?`: `"none"` \| `"token"`; `pepperRef?`: `string`; `perIpFailureThreshold?`: `number`; `perIpLockoutMs?`: `number`; `tokenEnvironments?`: `string`[]; `tokenPrefix?`: `string`; \}; `hardening?`: \{ `applyOnStart?`: `boolean`; `refuseRoot?`: `boolean`; `umask?`: `number`; \}; `health?`: \{ `walWarnThresholdBytes?`: `number`; \}; `metrics?`: \{ `enabled?`: `boolean`; `path?`: `string`; `requireAuth?`: `boolean`; \}; `observability?`: \{ `logger?`: `"json"` \| `"pretty"` \| `"silent"`; \}; `retention?`: \{ `auditDays?`: `number`; `consolidatorRunsDays?`: `number`; `dlqExhaustedDays?`: `number`; `enabled?`: `boolean`; `idempotency?`: `boolean`; `intervalMs?`: `number`; `memoryHistoryDays?`: `number`; `sessionsClosedOnly?`: `boolean`; `sessionsDays?`: `number`; `spansDays?`: `number`; `workflowThreadsDays?`: `number`; \}; `secrets?`: \{ `source?`: `"auto"` \| `"keyring"` \| `"encrypted-file"` \| `"env"`; `strict?`: `boolean`; \}; `server?`: \{ `basePath?`: `string`; `cors?`: \{ `allowCredentials?`: `boolean`; `allowHeaders?`: `string`[]; `allowMethods?`: `string`[]; `allowOrigins?`: `string`[]; `maxAgeSeconds?`: `number`; \}; `csrf?`: \{ `cookieName?`: `string`; `enabled?`: `boolean`; `headerName?`: `string`; `safeMethods?`: `string`[]; \}; `host?`: `string`; `idempotency?`: \{ `checkBodyFingerprint?`: `boolean`; `enabled?`: `boolean`; `lruCacheSize?`: `number`; `requireKey?`: `"off"` \| `"warn"` \| `"enforce"`; `ttlSeconds?`: `number`; \}; `port?`: `number`; `rateLimit?`: \{ `enabled?`: `boolean`; `perIpRequests?`: `number`; `windowMs?`: `number`; \}; `shutdown?`: \{ `drainTimeoutMs?`: `number`; \}; `sse?`: \{ `enabled?`: `boolean`; `keepAliveMs?`: `number`; `path?`: `string`; \}; `stream?`: \{ `disconnectGracePeriodMs?`: `number`; `disconnectPolicy?`: `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"`; `perConnectionQueueLimit?`: `number`; `replayBuffer?`: \{ `maxEvents?`: `number`; `pruneIntervalSeconds?`: `number`; `ttlSeconds?`: `number`; \}; \}; `trustProxy?`: `boolean`; `ws?`: \{ `commentarySanitization?`: \{ `applyToEvents?`: `string`[]; `policy?`: `"wrap"` \| `"strip"` \| `"pass-through"`; \}; `enabled?`: `boolean`; `path?`: `string`; `ticketTtlMs?`: `number`; \}; \}; `storage?`: \{ `encryption?`: \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; \}; `mode?`: `"server"` \| `"lib"`; `path?`: `string`; `walCheckpointIntervalMs?`: `number`; \}; \} \| `undefined` |

## Returns

  \| \{
  `audit?`: \{
     `cipher?`: `string`;
     `enabled?`: `boolean`;
     `passphraseRef?`: `string`;
     `path?`: `string`;
     `toolEvents?`: `"all"` \| `"off"` \| `"security"`;
  \};
  `auth?`: \{
     `kind?`: `"none"` \| `"token"`;
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
  `retention?`: \{
     `auditDays?`: `number`;
     `consolidatorRunsDays?`: `number`;
     `dlqExhaustedDays?`: `number`;
     `enabled?`: `boolean`;
     `idempotency?`: `boolean`;
     `intervalMs?`: `number`;
     `memoryHistoryDays?`: `number`;
     `sessionsClosedOnly?`: `boolean`;
     `sessionsDays?`: `number`;
     `spansDays?`: `number`;
     `workflowThreadsDays?`: `number`;
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
           `pruneIntervalSeconds?`: `number`;
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
     `mode?`: `"server"` \| `"lib"`;
     `path?`: `string`;
     `walCheckpointIntervalMs?`: `number`;
  \};
\}
  \| `undefined`

## Stable
