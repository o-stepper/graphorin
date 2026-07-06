[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [config](/api/@graphorin/server/config/index.md) / ServerConfigSpec

# Interface: ServerConfigSpec

Defined in: packages/server/src/config.ts:46

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-audit"></a> `audit` | `readonly` | \{ `cipher?`: `string`; `enabled`: `boolean`; `passphraseRef?`: `string`; `path?`: `string`; \} | packages/server/src/config.ts:115 |
| `audit.cipher?` | `readonly` | `string` | packages/server/src/config.ts:119 |
| `audit.enabled` | `readonly` | `boolean` | packages/server/src/config.ts:116 |
| `audit.passphraseRef?` | `readonly` | `string` | packages/server/src/config.ts:118 |
| `audit.path?` | `readonly` | `string` | packages/server/src/config.ts:117 |
| <a id="property-auth"></a> `auth` | `readonly` | \{ `kind`: `"none"` \| `"token"`; `pepperRef?`: `string`; `perIpFailureThreshold?`: `number`; `perIpLockoutMs?`: `number`; `tokenEnvironments`: readonly `string`[]; `tokenPrefix`: `string`; \} | packages/server/src/config.ts:125 |
| `auth.kind` | `readonly` | `"none"` \| `"token"` | packages/server/src/config.ts:126 |
| `auth.pepperRef?` | `readonly` | `string` | packages/server/src/config.ts:127 |
| `auth.perIpFailureThreshold?` | `readonly` | `number` | packages/server/src/config.ts:130 |
| `auth.perIpLockoutMs?` | `readonly` | `number` | packages/server/src/config.ts:131 |
| `auth.tokenEnvironments` | `readonly` | readonly `string`[] | packages/server/src/config.ts:129 |
| `auth.tokenPrefix` | `readonly` | `string` | packages/server/src/config.ts:128 |
| <a id="property-hardening"></a> `hardening` | `readonly` | \{ `applyOnStart`: `boolean`; `refuseRoot`: `boolean`; `umask`: `number`; \} | packages/server/src/config.ts:136 |
| `hardening.applyOnStart` | `readonly` | `boolean` | packages/server/src/config.ts:137 |
| `hardening.refuseRoot` | `readonly` | `boolean` | packages/server/src/config.ts:138 |
| `hardening.umask` | `readonly` | `number` | packages/server/src/config.ts:139 |
| <a id="property-health"></a> `health` | `readonly` | \{ `walWarnThresholdBytes`: `number`; \} | packages/server/src/config.ts:146 |
| `health.walWarnThresholdBytes` | `readonly` | `number` | packages/server/src/config.ts:147 |
| <a id="property-metrics"></a> `metrics` | `readonly` | \{ `enabled`: `boolean`; `path`: `string`; `requireAuth`: `boolean`; \} | packages/server/src/config.ts:141 |
| `metrics.enabled` | `readonly` | `boolean` | packages/server/src/config.ts:142 |
| `metrics.path` | `readonly` | `string` | packages/server/src/config.ts:143 |
| `metrics.requireAuth` | `readonly` | `boolean` | packages/server/src/config.ts:144 |
| <a id="property-observability"></a> `observability` | `readonly` | \{ `logger`: `"json"` \| `"pretty"` \| `"silent"`; \} | packages/server/src/config.ts:133 |
| `observability.logger` | `readonly` | `"json"` \| `"pretty"` \| `"silent"` | packages/server/src/config.ts:134 |
| <a id="property-secrets"></a> `secrets` | `readonly` | \{ `source`: [`SecretsSource`](/api/@graphorin/server/config/type-aliases/SecretsSource.md); `strict`: `boolean`; \} | packages/server/src/config.ts:121 |
| `secrets.source` | `readonly` | [`SecretsSource`](/api/@graphorin/server/config/type-aliases/SecretsSource.md) | packages/server/src/config.ts:122 |
| `secrets.strict` | `readonly` | `boolean` | packages/server/src/config.ts:123 |
| <a id="property-server"></a> `server` | `readonly` | \{ `basePath`: `string`; `cors`: \{ `allowCredentials`: `boolean`; `allowHeaders`: readonly `string`[]; `allowMethods`: readonly `string`[]; `allowOrigins`: readonly `string`[]; `maxAgeSeconds`: `number`; \}; `csrf`: \{ `cookieName`: `string`; `enabled`: `boolean`; `headerName`: `string`; `safeMethods`: readonly `string`[]; \}; `host`: `string`; `idempotency`: \{ `checkBodyFingerprint`: `boolean`; `enabled`: `boolean`; `lruCacheSize`: `number`; `requireKey`: [`IdempotencyRequireKeyMode`](/api/@graphorin/server/config/type-aliases/IdempotencyRequireKeyMode.md); `ttlSeconds`: `number`; \}; `port`: `number`; `rateLimit`: \{ `enabled`: `boolean`; `perIpRequests`: `number`; `windowMs`: `number`; \}; `shutdown`: \{ `drainTimeoutMs`: `number`; \}; `sse`: \{ `enabled`: `boolean`; `keepAliveMs`: `number`; `path`: `string`; \}; `stream`: \{ `disconnectGracePeriodMs`: `number`; `disconnectPolicy`: `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"`; `perConnectionQueueLimit`: `number`; `replayBuffer`: \{ `maxEvents`: `number`; `pruneIntervalSeconds`: `number`; `ttlSeconds`: `number`; \}; \}; `trustProxy`: `boolean`; `ws`: \{ `commentarySanitization`: \{ `applyToEvents`: readonly `string`[]; `policy`: [`DeliveryCommentaryPolicyConfig`](/api/@graphorin/server/config/type-aliases/DeliveryCommentaryPolicyConfig.md); \}; `enabled`: `boolean`; `path`: `string`; `ticketTtlMs`: `number`; \}; \} | packages/server/src/config.ts:47 |
| `server.basePath` | `readonly` | `string` | packages/server/src/config.ts:50 |
| `server.cors` | `readonly` | \{ `allowCredentials`: `boolean`; `allowHeaders`: readonly `string`[]; `allowMethods`: readonly `string`[]; `allowOrigins`: readonly `string`[]; `maxAgeSeconds`: `number`; \} | packages/server/src/config.ts:51 |
| `server.cors.allowCredentials` | `readonly` | `boolean` | packages/server/src/config.ts:53 |
| `server.cors.allowHeaders` | `readonly` | readonly `string`[] | packages/server/src/config.ts:55 |
| `server.cors.allowMethods` | `readonly` | readonly `string`[] | packages/server/src/config.ts:54 |
| `server.cors.allowOrigins` | `readonly` | readonly `string`[] | packages/server/src/config.ts:52 |
| `server.cors.maxAgeSeconds` | `readonly` | `number` | packages/server/src/config.ts:56 |
| `server.csrf` | `readonly` | \{ `cookieName`: `string`; `enabled`: `boolean`; `headerName`: `string`; `safeMethods`: readonly `string`[]; \} | packages/server/src/config.ts:58 |
| `server.csrf.cookieName` | `readonly` | `string` | packages/server/src/config.ts:60 |
| `server.csrf.enabled` | `readonly` | `boolean` | packages/server/src/config.ts:59 |
| `server.csrf.headerName` | `readonly` | `string` | packages/server/src/config.ts:61 |
| `server.csrf.safeMethods` | `readonly` | readonly `string`[] | packages/server/src/config.ts:62 |
| `server.host` | `readonly` | `string` | packages/server/src/config.ts:48 |
| `server.idempotency` | `readonly` | \{ `checkBodyFingerprint`: `boolean`; `enabled`: `boolean`; `lruCacheSize`: `number`; `requireKey`: [`IdempotencyRequireKeyMode`](/api/@graphorin/server/config/type-aliases/IdempotencyRequireKeyMode.md); `ttlSeconds`: `number`; \} | packages/server/src/config.ts:69 |
| `server.idempotency.checkBodyFingerprint` | `readonly` | `boolean` | packages/server/src/config.ts:73 |
| `server.idempotency.enabled` | `readonly` | `boolean` | packages/server/src/config.ts:70 |
| `server.idempotency.lruCacheSize` | `readonly` | `number` | packages/server/src/config.ts:74 |
| `server.idempotency.requireKey` | `readonly` | [`IdempotencyRequireKeyMode`](/api/@graphorin/server/config/type-aliases/IdempotencyRequireKeyMode.md) | packages/server/src/config.ts:71 |
| `server.idempotency.ttlSeconds` | `readonly` | `number` | packages/server/src/config.ts:72 |
| `server.port` | `readonly` | `number` | packages/server/src/config.ts:49 |
| `server.rateLimit` | `readonly` | \{ `enabled`: `boolean`; `perIpRequests`: `number`; `windowMs`: `number`; \} | packages/server/src/config.ts:64 |
| `server.rateLimit.enabled` | `readonly` | `boolean` | packages/server/src/config.ts:65 |
| `server.rateLimit.perIpRequests` | `readonly` | `number` | packages/server/src/config.ts:67 |
| `server.rateLimit.windowMs` | `readonly` | `number` | packages/server/src/config.ts:66 |
| `server.shutdown` | `readonly` | \{ `drainTimeoutMs`: `number`; \} | packages/server/src/config.ts:76 |
| `server.shutdown.drainTimeoutMs` | `readonly` | `number` | packages/server/src/config.ts:77 |
| `server.sse` | `readonly` | \{ `enabled`: `boolean`; `keepAliveMs`: `number`; `path`: `string`; \} | packages/server/src/config.ts:99 |
| `server.sse.enabled` | `readonly` | `boolean` | packages/server/src/config.ts:100 |
| `server.sse.keepAliveMs` | `readonly` | `number` | packages/server/src/config.ts:102 |
| `server.sse.path` | `readonly` | `string` | packages/server/src/config.ts:101 |
| `server.stream` | `readonly` | \{ `disconnectGracePeriodMs`: `number`; `disconnectPolicy`: `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"`; `perConnectionQueueLimit`: `number`; `replayBuffer`: \{ `maxEvents`: `number`; `pruneIntervalSeconds`: `number`; `ttlSeconds`: `number`; \}; \} | packages/server/src/config.ts:80 |
| `server.stream.disconnectGracePeriodMs` | `readonly` | `number` | packages/server/src/config.ts:82 |
| `server.stream.disconnectPolicy` | `readonly` | `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"` | packages/server/src/config.ts:81 |
| `server.stream.perConnectionQueueLimit` | `readonly` | `number` | packages/server/src/config.ts:88 |
| `server.stream.replayBuffer` | `readonly` | \{ `maxEvents`: `number`; `pruneIntervalSeconds`: `number`; `ttlSeconds`: `number`; \} | packages/server/src/config.ts:83 |
| `server.stream.replayBuffer.maxEvents` | `readonly` | `number` | packages/server/src/config.ts:84 |
| `server.stream.replayBuffer.pruneIntervalSeconds` | `readonly` | `number` | packages/server/src/config.ts:86 |
| `server.stream.replayBuffer.ttlSeconds` | `readonly` | `number` | packages/server/src/config.ts:85 |
| `server.trustProxy` | `readonly` | `boolean` | packages/server/src/config.ts:79 |
| `server.ws` | `readonly` | \{ `commentarySanitization`: \{ `applyToEvents`: readonly `string`[]; `policy`: [`DeliveryCommentaryPolicyConfig`](/api/@graphorin/server/config/type-aliases/DeliveryCommentaryPolicyConfig.md); \}; `enabled`: `boolean`; `path`: `string`; `ticketTtlMs`: `number`; \} | packages/server/src/config.ts:90 |
| `server.ws.commentarySanitization` | `readonly` | \{ `applyToEvents`: readonly `string`[]; `policy`: [`DeliveryCommentaryPolicyConfig`](/api/@graphorin/server/config/type-aliases/DeliveryCommentaryPolicyConfig.md); \} | packages/server/src/config.ts:94 |
| `server.ws.commentarySanitization.applyToEvents` | `readonly` | readonly `string`[] | packages/server/src/config.ts:96 |
| `server.ws.commentarySanitization.policy` | `readonly` | [`DeliveryCommentaryPolicyConfig`](/api/@graphorin/server/config/type-aliases/DeliveryCommentaryPolicyConfig.md) | packages/server/src/config.ts:95 |
| `server.ws.enabled` | `readonly` | `boolean` | packages/server/src/config.ts:91 |
| `server.ws.path` | `readonly` | `string` | packages/server/src/config.ts:92 |
| `server.ws.ticketTtlMs` | `readonly` | `number` | packages/server/src/config.ts:93 |
| <a id="property-storage"></a> `storage` | `readonly` | \{ `encryption`: \{ `cipher?`: `string`; `enabled`: `boolean`; `passphraseRef?`: `string`; \}; `mode`: `"server"` \| `"lib"`; `path`: `string`; `walCheckpointIntervalMs?`: `number`; \} | packages/server/src/config.ts:105 |
| `storage.encryption` | `readonly` | \{ `cipher?`: `string`; `enabled`: `boolean`; `passphraseRef?`: `string`; \} | packages/server/src/config.ts:109 |
| `storage.encryption.cipher?` | `readonly` | `string` | packages/server/src/config.ts:111 |
| `storage.encryption.enabled` | `readonly` | `boolean` | packages/server/src/config.ts:110 |
| `storage.encryption.passphraseRef?` | `readonly` | `string` | packages/server/src/config.ts:112 |
| `storage.mode` | `readonly` | `"server"` \| `"lib"` | packages/server/src/config.ts:107 |
| `storage.path` | `readonly` | `string` | packages/server/src/config.ts:106 |
| `storage.walCheckpointIntervalMs?` | `readonly` | `number` | packages/server/src/config.ts:108 |
