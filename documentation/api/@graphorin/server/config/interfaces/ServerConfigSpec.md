[**Graphorin API reference v0.13.6**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [config](/api/@graphorin/server/config/index.md) / ServerConfigSpec

# Interface: ServerConfigSpec

Defined in: packages/server/src/config.ts:46

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-app"></a> `app?` | `readonly` | `string` | Path to an app-compose module, relative to the config file. The standalone launcher (`graphorin start`) imports it and spreads the returned adapter bag (sessions / memory / agents / workflows / ...) into `createServer(...)`, mounting the full domain surface. Ignored by `createServer` itself - programmatic embedders pass adapters directly. | packages/server/src/config.ts:55 |
| <a id="property-audit"></a> `audit` | `readonly` | \{ `cipher?`: `string`; `enabled`: `boolean`; `passphraseRef?`: `string`; `path?`: `string`; `toolEvents`: `"all"` \| `"off"` \| `"security"`; \} | - | packages/server/src/config.ts:146 |
| `audit.cipher?` | `readonly` | `string` | - | packages/server/src/config.ts:150 |
| `audit.enabled` | `readonly` | `boolean` | - | packages/server/src/config.ts:147 |
| `audit.passphraseRef?` | `readonly` | `string` | - | packages/server/src/config.ts:149 |
| `audit.path?` | `readonly` | `string` | - | packages/server/src/config.ts:148 |
| `audit.toolEvents` | `readonly` | `"all"` \| `"off"` \| `"security"` | Which tools/MCP audit-bus events land in the audit chain. `'security'` (default) writes the security-significant subset (dataflow flagged/blocked/declassified, sanitization, approvals, collisions, cap-disabled); `'all'` adds per-call `tool:execute:*` chatter; `'off'` disables the bridge. | packages/server/src/config.ts:158 |
| <a id="property-auth"></a> `auth` | `readonly` | \{ `kind`: `"none"` \| `"token"`; `pepperRef?`: `string`; `perIpFailureThreshold?`: `number`; `perIpLockoutMs?`: `number`; `tokenEnvironments`: readonly `string`[]; `tokenPrefix`: `string`; \} | - | packages/server/src/config.ts:164 |
| `auth.kind` | `readonly` | `"none"` \| `"token"` | - | packages/server/src/config.ts:165 |
| `auth.pepperRef?` | `readonly` | `string` | - | packages/server/src/config.ts:166 |
| `auth.perIpFailureThreshold?` | `readonly` | `number` | - | packages/server/src/config.ts:169 |
| `auth.perIpLockoutMs?` | `readonly` | `number` | - | packages/server/src/config.ts:170 |
| `auth.tokenEnvironments` | `readonly` | readonly `string`[] | - | packages/server/src/config.ts:168 |
| `auth.tokenPrefix` | `readonly` | `string` | - | packages/server/src/config.ts:167 |
| <a id="property-hardening"></a> `hardening` | `readonly` | \{ `applyOnStart`: `boolean`; `refuseRoot`: `boolean`; `umask`: `number`; \} | - | packages/server/src/config.ts:175 |
| `hardening.applyOnStart` | `readonly` | `boolean` | - | packages/server/src/config.ts:176 |
| `hardening.refuseRoot` | `readonly` | `boolean` | - | packages/server/src/config.ts:177 |
| `hardening.umask` | `readonly` | `number` | - | packages/server/src/config.ts:178 |
| <a id="property-health"></a> `health` | `readonly` | \{ `walWarnThresholdBytes`: `number`; \} | - | packages/server/src/config.ts:192 |
| `health.walWarnThresholdBytes` | `readonly` | `number` | - | packages/server/src/config.ts:193 |
| <a id="property-metrics"></a> `metrics` | `readonly` | \{ `enabled`: `boolean`; `path`: `string`; `requireAuth`: `boolean`; \} | - | packages/server/src/config.ts:180 |
| `metrics.enabled` | `readonly` | `boolean` | - | packages/server/src/config.ts:181 |
| `metrics.path` | `readonly` | `string` | - | packages/server/src/config.ts:182 |
| `metrics.requireAuth` | `readonly` | `boolean` | Require a verified token with `admin:metrics:read` on the exposition endpoint. Default `true` since 0.12.0: the exposition leaks operational intel (trigger ids in labels, consolidator budgets), so scraping is authenticated unless the operator explicitly opts out for a trusted network. | packages/server/src/config.ts:190 |
| <a id="property-observability"></a> `observability` | `readonly` | \{ `logger`: `"json"` \| `"pretty"` \| `"silent"`; \} | - | packages/server/src/config.ts:172 |
| `observability.logger` | `readonly` | `"json"` \| `"pretty"` \| `"silent"` | - | packages/server/src/config.ts:173 |
| <a id="property-retention"></a> `retention` | `readonly` | \{ `auditDays?`: `number`; `consolidatorRunsDays`: `number`; `dlqExhaustedDays`: `number`; `enabled`: `boolean`; `idempotency`: `boolean`; `intervalMs`: `number`; `memoryHistoryDays?`: `number`; `sessionsClosedOnly`: `boolean`; `sessionsDays?`: `number`; `spansDays`: `number`; `workflowThreadsDays?`: `number`; \} | - | packages/server/src/config.ts:133 |
| `retention.auditDays?` | `readonly` | `number` | - | packages/server/src/config.ts:144 |
| `retention.consolidatorRunsDays` | `readonly` | `number` | - | packages/server/src/config.ts:137 |
| `retention.dlqExhaustedDays` | `readonly` | `number` | - | packages/server/src/config.ts:138 |
| `retention.enabled` | `readonly` | `boolean` | - | packages/server/src/config.ts:134 |
| `retention.idempotency` | `readonly` | `boolean` | - | packages/server/src/config.ts:139 |
| `retention.intervalMs` | `readonly` | `number` | - | packages/server/src/config.ts:135 |
| `retention.memoryHistoryDays?` | `readonly` | `number` | - | packages/server/src/config.ts:142 |
| `retention.sessionsClosedOnly` | `readonly` | `boolean` | - | packages/server/src/config.ts:141 |
| `retention.sessionsDays?` | `readonly` | `number` | - | packages/server/src/config.ts:140 |
| `retention.spansDays` | `readonly` | `number` | - | packages/server/src/config.ts:136 |
| `retention.workflowThreadsDays?` | `readonly` | `number` | - | packages/server/src/config.ts:143 |
| <a id="property-secrets"></a> `secrets` | `readonly` | \{ `source`: [`SecretsSource`](/api/@graphorin/server/config/type-aliases/SecretsSource.md); `strict`: `boolean`; \} | - | packages/server/src/config.ts:160 |
| `secrets.source` | `readonly` | [`SecretsSource`](/api/@graphorin/server/config/type-aliases/SecretsSource.md) | - | packages/server/src/config.ts:161 |
| `secrets.strict` | `readonly` | `boolean` | - | packages/server/src/config.ts:162 |
| <a id="property-server"></a> `server` | `readonly` | \{ `basePath`: `string`; `cors`: \{ `allowCredentials`: `boolean`; `allowHeaders`: readonly `string`[]; `allowMethods`: readonly `string`[]; `allowOrigins`: readonly `string`[]; `maxAgeSeconds`: `number`; \}; `csrf`: \{ `cookieName`: `string`; `enabled`: `boolean`; `headerName`: `string`; `safeMethods`: readonly `string`[]; \}; `host`: `string`; `idempotency`: \{ `checkBodyFingerprint`: `boolean`; `enabled`: `boolean`; `lruCacheSize`: `number`; `requireKey`: [`IdempotencyRequireKeyMode`](/api/@graphorin/server/config/type-aliases/IdempotencyRequireKeyMode.md); `ttlSeconds`: `number`; \}; `port`: `number`; `rateLimit`: \{ `enabled`: `boolean`; `perIpRequests`: `number`; `windowMs`: `number`; \}; `shutdown`: \{ `drainTimeoutMs`: `number`; \}; `sse`: \{ `enabled`: `boolean`; `keepAliveMs`: `number`; `path`: `string`; \}; `stream`: \{ `disconnectGracePeriodMs`: `number`; `disconnectPolicy`: `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"`; `perConnectionQueueLimit`: `number`; `replayBuffer`: \{ `maxEvents`: `number`; `pruneIntervalSeconds`: `number`; `ttlSeconds`: `number`; \}; \}; `tlsTerminatedUpstream`: `boolean`; `trustProxy`: `boolean`; `ws`: \{ `commentarySanitization`: \{ `applyToEvents`: readonly `string`[]; `policy`: [`DeliveryCommentaryPolicyConfig`](/api/@graphorin/server/config/type-aliases/DeliveryCommentaryPolicyConfig.md); \}; `enabled`: `boolean`; `path`: `string`; `ticketTtlMs`: `number`; \}; \} | - | packages/server/src/config.ts:56 |
| `server.basePath` | `readonly` | `string` | - | packages/server/src/config.ts:59 |
| `server.cors` | `readonly` | \{ `allowCredentials`: `boolean`; `allowHeaders`: readonly `string`[]; `allowMethods`: readonly `string`[]; `allowOrigins`: readonly `string`[]; `maxAgeSeconds`: `number`; \} | - | packages/server/src/config.ts:60 |
| `server.cors.allowCredentials` | `readonly` | `boolean` | - | packages/server/src/config.ts:62 |
| `server.cors.allowHeaders` | `readonly` | readonly `string`[] | - | packages/server/src/config.ts:64 |
| `server.cors.allowMethods` | `readonly` | readonly `string`[] | - | packages/server/src/config.ts:63 |
| `server.cors.allowOrigins` | `readonly` | readonly `string`[] | - | packages/server/src/config.ts:61 |
| `server.cors.maxAgeSeconds` | `readonly` | `number` | - | packages/server/src/config.ts:65 |
| `server.csrf` | `readonly` | \{ `cookieName`: `string`; `enabled`: `boolean`; `headerName`: `string`; `safeMethods`: readonly `string`[]; \} | - | packages/server/src/config.ts:67 |
| `server.csrf.cookieName` | `readonly` | `string` | - | packages/server/src/config.ts:69 |
| `server.csrf.enabled` | `readonly` | `boolean` | - | packages/server/src/config.ts:68 |
| `server.csrf.headerName` | `readonly` | `string` | - | packages/server/src/config.ts:70 |
| `server.csrf.safeMethods` | `readonly` | readonly `string`[] | - | packages/server/src/config.ts:71 |
| `server.host` | `readonly` | `string` | - | packages/server/src/config.ts:57 |
| `server.idempotency` | `readonly` | \{ `checkBodyFingerprint`: `boolean`; `enabled`: `boolean`; `lruCacheSize`: `number`; `requireKey`: [`IdempotencyRequireKeyMode`](/api/@graphorin/server/config/type-aliases/IdempotencyRequireKeyMode.md); `ttlSeconds`: `number`; \} | - | packages/server/src/config.ts:78 |
| `server.idempotency.checkBodyFingerprint` | `readonly` | `boolean` | - | packages/server/src/config.ts:82 |
| `server.idempotency.enabled` | `readonly` | `boolean` | - | packages/server/src/config.ts:79 |
| `server.idempotency.lruCacheSize` | `readonly` | `number` | - | packages/server/src/config.ts:83 |
| `server.idempotency.requireKey` | `readonly` | [`IdempotencyRequireKeyMode`](/api/@graphorin/server/config/type-aliases/IdempotencyRequireKeyMode.md) | - | packages/server/src/config.ts:80 |
| `server.idempotency.ttlSeconds` | `readonly` | `number` | - | packages/server/src/config.ts:81 |
| `server.port` | `readonly` | `number` | - | packages/server/src/config.ts:58 |
| `server.rateLimit` | `readonly` | \{ `enabled`: `boolean`; `perIpRequests`: `number`; `windowMs`: `number`; \} | - | packages/server/src/config.ts:73 |
| `server.rateLimit.enabled` | `readonly` | `boolean` | - | packages/server/src/config.ts:74 |
| `server.rateLimit.perIpRequests` | `readonly` | `number` | - | packages/server/src/config.ts:76 |
| `server.rateLimit.windowMs` | `readonly` | `number` | - | packages/server/src/config.ts:75 |
| `server.shutdown` | `readonly` | \{ `drainTimeoutMs`: `number`; \} | - | packages/server/src/config.ts:85 |
| `server.shutdown.drainTimeoutMs` | `readonly` | `number` | - | packages/server/src/config.ts:86 |
| `server.sse` | `readonly` | \{ `enabled`: `boolean`; `keepAliveMs`: `number`; `path`: `string`; \} | - | packages/server/src/config.ts:117 |
| `server.sse.enabled` | `readonly` | `boolean` | - | packages/server/src/config.ts:118 |
| `server.sse.keepAliveMs` | `readonly` | `number` | - | packages/server/src/config.ts:120 |
| `server.sse.path` | `readonly` | `string` | - | packages/server/src/config.ts:119 |
| `server.stream` | `readonly` | \{ `disconnectGracePeriodMs`: `number`; `disconnectPolicy`: `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"`; `perConnectionQueueLimit`: `number`; `replayBuffer`: \{ `maxEvents`: `number`; `pruneIntervalSeconds`: `number`; `ttlSeconds`: `number`; \}; \} | - | packages/server/src/config.ts:98 |
| `server.stream.disconnectGracePeriodMs` | `readonly` | `number` | - | packages/server/src/config.ts:100 |
| `server.stream.disconnectPolicy` | `readonly` | `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"` | - | packages/server/src/config.ts:99 |
| `server.stream.perConnectionQueueLimit` | `readonly` | `number` | - | packages/server/src/config.ts:106 |
| `server.stream.replayBuffer` | `readonly` | \{ `maxEvents`: `number`; `pruneIntervalSeconds`: `number`; `ttlSeconds`: `number`; \} | - | packages/server/src/config.ts:101 |
| `server.stream.replayBuffer.maxEvents` | `readonly` | `number` | - | packages/server/src/config.ts:102 |
| `server.stream.replayBuffer.pruneIntervalSeconds` | `readonly` | `number` | - | packages/server/src/config.ts:104 |
| `server.stream.replayBuffer.ttlSeconds` | `readonly` | `number` | - | packages/server/src/config.ts:103 |
| `server.tlsTerminatedUpstream` | `readonly` | `boolean` | Operator acknowledgement that a TLS-terminating reverse proxy fronts this server. Graphorin itself serves PLAINTEXT HTTP only - there is deliberately no in-process TLS - so a non-loopback bind without this acknowledgement logs a startup WARN (bearer tokens would otherwise cross the network unencrypted). Setting it `true` silences the warning; it changes no runtime behaviour. | packages/server/src/config.ts:97 |
| `server.trustProxy` | `readonly` | `boolean` | - | packages/server/src/config.ts:88 |
| `server.ws` | `readonly` | \{ `commentarySanitization`: \{ `applyToEvents`: readonly `string`[]; `policy`: [`DeliveryCommentaryPolicyConfig`](/api/@graphorin/server/config/type-aliases/DeliveryCommentaryPolicyConfig.md); \}; `enabled`: `boolean`; `path`: `string`; `ticketTtlMs`: `number`; \} | - | packages/server/src/config.ts:108 |
| `server.ws.commentarySanitization` | `readonly` | \{ `applyToEvents`: readonly `string`[]; `policy`: [`DeliveryCommentaryPolicyConfig`](/api/@graphorin/server/config/type-aliases/DeliveryCommentaryPolicyConfig.md); \} | - | packages/server/src/config.ts:112 |
| `server.ws.commentarySanitization.applyToEvents` | `readonly` | readonly `string`[] | - | packages/server/src/config.ts:114 |
| `server.ws.commentarySanitization.policy` | `readonly` | [`DeliveryCommentaryPolicyConfig`](/api/@graphorin/server/config/type-aliases/DeliveryCommentaryPolicyConfig.md) | - | packages/server/src/config.ts:113 |
| `server.ws.enabled` | `readonly` | `boolean` | - | packages/server/src/config.ts:109 |
| `server.ws.path` | `readonly` | `string` | - | packages/server/src/config.ts:110 |
| `server.ws.ticketTtlMs` | `readonly` | `number` | - | packages/server/src/config.ts:111 |
| <a id="property-storage"></a> `storage` | `readonly` | \{ `encryption`: \{ `cipher?`: `string`; `enabled`: `boolean`; `passphraseRef?`: `string`; \}; `mode`: `"server"` \| `"lib"`; `path`: `string`; `walCheckpointIntervalMs?`: `number`; \} | - | packages/server/src/config.ts:123 |
| `storage.encryption` | `readonly` | \{ `cipher?`: `string`; `enabled`: `boolean`; `passphraseRef?`: `string`; \} | - | packages/server/src/config.ts:127 |
| `storage.encryption.cipher?` | `readonly` | `string` | - | packages/server/src/config.ts:129 |
| `storage.encryption.enabled` | `readonly` | `boolean` | - | packages/server/src/config.ts:128 |
| `storage.encryption.passphraseRef?` | `readonly` | `string` | - | packages/server/src/config.ts:130 |
| `storage.mode` | `readonly` | `"server"` \| `"lib"` | - | packages/server/src/config.ts:125 |
| `storage.path` | `readonly` | `string` | - | packages/server/src/config.ts:124 |
| `storage.walCheckpointIntervalMs?` | `readonly` | `number` | - | packages/server/src/config.ts:126 |
