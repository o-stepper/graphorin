[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / CreateServerOptions

# Interface: CreateServerOptions

Defined in: packages/server/src/app.ts:119

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agents"></a> `agents?` | `readonly` | [`AgentRegistry`](/api/@graphorin/server/registry/classes/AgentRegistry.md) | Optional pre-built registries. | packages/server/src/app.ts:138 |
| <a id="property-audit"></a> `audit?` | `readonly` | [`AuditApi`](/api/@graphorin/server/interfaces/AuditApi.md) | - | packages/server/src/app.ts:145 |
| <a id="property-channels"></a> `channels?` | `readonly` | [`ChannelsInput`](/api/@graphorin/server/type-aliases/ChannelsInput.md) | Optional channel-gateway surface (`@graphorin/channels`, matched structurally - no package dependency). Pass the gateway (`{ gateway }`) or a pre-built daemon; the server starts/stops it with the lifecycle, reports it on `/v1/health`, and bridges accepted inbound messages into `scheduler.recordActivity()`. | packages/server/src/app.ts:172 |
| <a id="property-config"></a> `config?` | `readonly` | \{ `app?`: `string`; `audit?`: \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; `path?`: `string`; `toolEvents?`: `"all"` \| `"off"` \| `"security"`; \}; `auth?`: \{ `kind?`: `"none"` \| `"token"`; `pepperRef?`: `string`; `perIpFailureThreshold?`: `number`; `perIpLockoutMs?`: `number`; `tokenEnvironments?`: `string`[]; `tokenPrefix?`: `string`; \}; `hardening?`: \{ `applyOnStart?`: `boolean`; `refuseRoot?`: `boolean`; `umask?`: `number`; \}; `health?`: \{ `walWarnThresholdBytes?`: `number`; \}; `metrics?`: \{ `enabled?`: `boolean`; `path?`: `string`; `requireAuth?`: `boolean`; \}; `observability?`: \{ `logger?`: `"json"` \| `"pretty"` \| `"silent"`; \}; `retention?`: \{ `auditDays?`: `number`; `consolidatorRunsDays?`: `number`; `dlqExhaustedDays?`: `number`; `enabled?`: `boolean`; `idempotency?`: `boolean`; `intervalMs?`: `number`; `memoryHistoryDays?`: `number`; `sessionsClosedOnly?`: `boolean`; `sessionsDays?`: `number`; `spansDays?`: `number`; `workflowThreadsDays?`: `number`; \}; `secrets?`: \{ `source?`: `"auto"` \| `"keyring"` \| `"encrypted-file"` \| `"env"`; `strict?`: `boolean`; \}; `server?`: \{ `basePath?`: `string`; `cors?`: \{ `allowCredentials?`: `boolean`; `allowHeaders?`: `string`[]; `allowMethods?`: `string`[]; `allowOrigins?`: `string`[]; `maxAgeSeconds?`: `number`; \}; `csrf?`: \{ `cookieName?`: `string`; `enabled?`: `boolean`; `headerName?`: `string`; `safeMethods?`: `string`[]; \}; `host?`: `string`; `idempotency?`: \{ `checkBodyFingerprint?`: `boolean`; `enabled?`: `boolean`; `lruCacheSize?`: `number`; `requireKey?`: `"off"` \| `"warn"` \| `"enforce"`; `ttlSeconds?`: `number`; \}; `port?`: `number`; `rateLimit?`: \{ `enabled?`: `boolean`; `perIpRequests?`: `number`; `windowMs?`: `number`; \}; `shutdown?`: \{ `drainTimeoutMs?`: `number`; \}; `sse?`: \{ `enabled?`: `boolean`; `keepAliveMs?`: `number`; `path?`: `string`; \}; `stream?`: \{ `disconnectGracePeriodMs?`: `number`; `disconnectPolicy?`: `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"`; `perConnectionQueueLimit?`: `number`; `replayBuffer?`: \{ `maxEvents?`: `number`; `pruneIntervalSeconds?`: `number`; `ttlSeconds?`: `number`; \}; \}; `tlsTerminatedUpstream?`: `boolean`; `trustProxy?`: `boolean`; `ws?`: \{ `commentarySanitization?`: \{ `applyToEvents?`: `string`[]; `policy?`: `"wrap"` \| `"strip"` \| `"pass-through"`; \}; `enabled?`: `boolean`; `path?`: `string`; `ticketTtlMs?`: `number`; \}; \}; `storage?`: \{ `encryption?`: \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; \}; `mode?`: `"server"` \| `"lib"`; `path?`: `string`; `walCheckpointIntervalMs?`: `number`; \}; \} | Loaded `graphorin.config.ts` payload - see `defineConfig({...})`. | packages/server/src/app.ts:121 |
| `config.app?` | `public` | `string` | - | packages/server/src/config.ts:452 |
| `config.audit?` | `public` | \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; `path?`: `string`; `toolEvents?`: `"all"` \| `"off"` \| `"security"`; \} | - | packages/server/src/config.ts:456 |
| `config.audit.cipher?` | `public` | `string` | - | packages/server/src/config.ts:375 |
| `config.audit.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:372 |
| `config.audit.passphraseRef?` | `public` | `string` | - | packages/server/src/config.ts:374 |
| `config.audit.path?` | `public` | `string` | - | packages/server/src/config.ts:373 |
| `config.audit.toolEvents?` | `public` | `"all"` \| `"off"` \| `"security"` | - | packages/server/src/config.ts:377 |
| `config.auth?` | `public` | \{ `kind?`: `"none"` \| `"token"`; `pepperRef?`: `string`; `perIpFailureThreshold?`: `number`; `perIpLockoutMs?`: `number`; `tokenEnvironments?`: `string`[]; `tokenPrefix?`: `string`; \} | - | packages/server/src/config.ts:458 |
| `config.auth.kind?` | `public` | `"none"` \| `"token"` | - | packages/server/src/config.ts:392 |
| `config.auth.pepperRef?` | `public` | `string` | - | packages/server/src/config.ts:393 |
| `config.auth.perIpFailureThreshold?` | `public` | `number` | - | packages/server/src/config.ts:396 |
| `config.auth.perIpLockoutMs?` | `public` | `number` | - | packages/server/src/config.ts:397 |
| `config.auth.tokenEnvironments?` | `public` | `string`[] | - | packages/server/src/config.ts:395 |
| `config.auth.tokenPrefix?` | `public` | `string` | - | packages/server/src/config.ts:394 |
| `config.hardening?` | `public` | \{ `applyOnStart?`: `boolean`; `refuseRoot?`: `boolean`; `umask?`: `number`; \} | - | packages/server/src/config.ts:460 |
| `config.hardening.applyOnStart?` | `public` | `boolean` | - | packages/server/src/config.ts:411 |
| `config.hardening.refuseRoot?` | `public` | `boolean` | - | packages/server/src/config.ts:412 |
| `config.hardening.umask?` | `public` | `number` | - | packages/server/src/config.ts:413 |
| `config.health?` | `public` | \{ `walWarnThresholdBytes?`: `number`; \} | - | packages/server/src/config.ts:462 |
| `config.health.walWarnThresholdBytes?` | `public` | `number` | - | packages/server/src/config.ts:432 |
| `config.metrics?` | `public` | \{ `enabled?`: `boolean`; `path?`: `string`; `requireAuth?`: `boolean`; \} | - | packages/server/src/config.ts:461 |
| `config.metrics.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:420 |
| `config.metrics.path?` | `public` | `string` | - | packages/server/src/config.ts:421 |
| `config.metrics.requireAuth?` | `public` | `boolean` | - | packages/server/src/config.ts:425 |
| `config.observability?` | `public` | \{ `logger?`: `"json"` \| `"pretty"` \| `"silent"`; \} | - | packages/server/src/config.ts:459 |
| `config.observability.logger?` | `public` | `"json"` \| `"pretty"` \| `"silent"` | - | packages/server/src/config.ts:404 |
| `config.retention?` | `public` | \{ `auditDays?`: `number`; `consolidatorRunsDays?`: `number`; `dlqExhaustedDays?`: `number`; `enabled?`: `boolean`; `idempotency?`: `boolean`; `intervalMs?`: `number`; `memoryHistoryDays?`: `number`; `sessionsClosedOnly?`: `boolean`; `sessionsDays?`: `number`; `spansDays?`: `number`; `workflowThreadsDays?`: `number`; \} | - | packages/server/src/config.ts:455 |
| `config.retention.auditDays?` | `public` | `number` | - | packages/server/src/config.ts:365 |
| `config.retention.consolidatorRunsDays?` | `public` | `number` | - | packages/server/src/config.ts:358 |
| `config.retention.dlqExhaustedDays?` | `public` | `number` | - | packages/server/src/config.ts:359 |
| `config.retention.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:351 |
| `config.retention.idempotency?` | `public` | `boolean` | - | packages/server/src/config.ts:360 |
| `config.retention.intervalMs?` | `public` | `number` | - | packages/server/src/config.ts:352 |
| `config.retention.memoryHistoryDays?` | `public` | `number` | - | packages/server/src/config.ts:363 |
| `config.retention.sessionsClosedOnly?` | `public` | `boolean` | - | packages/server/src/config.ts:362 |
| `config.retention.sessionsDays?` | `public` | `number` | - | packages/server/src/config.ts:361 |
| `config.retention.spansDays?` | `public` | `number` | - | packages/server/src/config.ts:357 |
| `config.retention.workflowThreadsDays?` | `public` | `number` | - | packages/server/src/config.ts:364 |
| `config.secrets?` | `public` | \{ `source?`: `"auto"` \| `"keyring"` \| `"encrypted-file"` \| `"env"`; `strict?`: `boolean`; \} | - | packages/server/src/config.ts:457 |
| `config.secrets.source?` | `public` | `"auto"` \| `"keyring"` \| `"encrypted-file"` \| `"env"` | - | packages/server/src/config.ts:384 |
| `config.secrets.strict?` | `public` | `boolean` | - | packages/server/src/config.ts:385 |
| `config.server?` | `public` | \{ `basePath?`: `string`; `cors?`: \{ `allowCredentials?`: `boolean`; `allowHeaders?`: `string`[]; `allowMethods?`: `string`[]; `allowOrigins?`: `string`[]; `maxAgeSeconds?`: `number`; \}; `csrf?`: \{ `cookieName?`: `string`; `enabled?`: `boolean`; `headerName?`: `string`; `safeMethods?`: `string`[]; \}; `host?`: `string`; `idempotency?`: \{ `checkBodyFingerprint?`: `boolean`; `enabled?`: `boolean`; `lruCacheSize?`: `number`; `requireKey?`: `"off"` \| `"warn"` \| `"enforce"`; `ttlSeconds?`: `number`; \}; `port?`: `number`; `rateLimit?`: \{ `enabled?`: `boolean`; `perIpRequests?`: `number`; `windowMs?`: `number`; \}; `shutdown?`: \{ `drainTimeoutMs?`: `number`; \}; `sse?`: \{ `enabled?`: `boolean`; `keepAliveMs?`: `number`; `path?`: `string`; \}; `stream?`: \{ `disconnectGracePeriodMs?`: `number`; `disconnectPolicy?`: `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"`; `perConnectionQueueLimit?`: `number`; `replayBuffer?`: \{ `maxEvents?`: `number`; `pruneIntervalSeconds?`: `number`; `ttlSeconds?`: `number`; \}; \}; `tlsTerminatedUpstream?`: `boolean`; `trustProxy?`: `boolean`; `ws?`: \{ `commentarySanitization?`: \{ `applyToEvents?`: `string`[]; `policy?`: `"wrap"` \| `"strip"` \| `"pass-through"`; \}; `enabled?`: `boolean`; `path?`: `string`; `ticketTtlMs?`: `number`; \}; \} | - | packages/server/src/config.ts:453 |
| `config.server.basePath?` | `public` | `string` | - | packages/server/src/config.ts:307 |
| `config.server.cors?` | `public` | \{ `allowCredentials?`: `boolean`; `allowHeaders?`: `string`[]; `allowMethods?`: `string`[]; `allowOrigins?`: `string`[]; `maxAgeSeconds?`: `number`; \} | - | packages/server/src/config.ts:308 |
| `config.server.cors.allowCredentials?` | `public` | `boolean` | - | packages/server/src/config.ts:200 |
| `config.server.cors.allowHeaders?` | `public` | `string`[] | - | packages/server/src/config.ts:202 |
| `config.server.cors.allowMethods?` | `public` | `string`[] | - | packages/server/src/config.ts:201 |
| `config.server.cors.allowOrigins?` | `public` | `string`[] | - | packages/server/src/config.ts:199 |
| `config.server.cors.maxAgeSeconds?` | `public` | `number` | - | packages/server/src/config.ts:205 |
| `config.server.csrf?` | `public` | \{ `cookieName?`: `string`; `enabled?`: `boolean`; `headerName?`: `string`; `safeMethods?`: `string`[]; \} | - | packages/server/src/config.ts:309 |
| `config.server.csrf.cookieName?` | `public` | `string` | - | packages/server/src/config.ts:213 |
| `config.server.csrf.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:212 |
| `config.server.csrf.headerName?` | `public` | `string` | - | packages/server/src/config.ts:214 |
| `config.server.csrf.safeMethods?` | `public` | `string`[] | - | packages/server/src/config.ts:215 |
| `config.server.host?` | `public` | `string` | - | packages/server/src/config.ts:305 |
| `config.server.idempotency?` | `public` | \{ `checkBodyFingerprint?`: `boolean`; `enabled?`: `boolean`; `lruCacheSize?`: `number`; `requireKey?`: `"off"` \| `"warn"` \| `"enforce"`; `ttlSeconds?`: `number`; \} | - | packages/server/src/config.ts:311 |
| `config.server.idempotency.checkBodyFingerprint?` | `public` | `boolean` | - | packages/server/src/config.ts:234 |
| `config.server.idempotency.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:231 |
| `config.server.idempotency.lruCacheSize?` | `public` | `number` | - | packages/server/src/config.ts:235 |
| `config.server.idempotency.requireKey?` | `public` | `"off"` \| `"warn"` \| `"enforce"` | - | packages/server/src/config.ts:232 |
| `config.server.idempotency.ttlSeconds?` | `public` | `number` | - | packages/server/src/config.ts:233 |
| `config.server.port?` | `public` | `number` | - | packages/server/src/config.ts:306 |
| `config.server.rateLimit?` | `public` | \{ `enabled?`: `boolean`; `perIpRequests?`: `number`; `windowMs?`: `number`; \} | - | packages/server/src/config.ts:310 |
| `config.server.rateLimit.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:222 |
| `config.server.rateLimit.perIpRequests?` | `public` | `number` | - | packages/server/src/config.ts:224 |
| `config.server.rateLimit.windowMs?` | `public` | `number` | - | packages/server/src/config.ts:223 |
| `config.server.shutdown?` | `public` | \{ `drainTimeoutMs?`: `number`; \} | - | packages/server/src/config.ts:312 |
| `config.server.shutdown.drainTimeoutMs?` | `public` | `number` | - | packages/server/src/config.ts:242 |
| `config.server.sse?` | `public` | \{ `enabled?`: `boolean`; `keepAliveMs?`: `number`; `path?`: `string`; \} | - | packages/server/src/config.ts:317 |
| `config.server.sse.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:296 |
| `config.server.sse.keepAliveMs?` | `public` | `number` | - | packages/server/src/config.ts:298 |
| `config.server.sse.path?` | `public` | `string` | - | packages/server/src/config.ts:297 |
| `config.server.stream?` | `public` | \{ `disconnectGracePeriodMs?`: `number`; `disconnectPolicy?`: `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"`; `perConnectionQueueLimit?`: `number`; `replayBuffer?`: \{ `maxEvents?`: `number`; `pruneIntervalSeconds?`: `number`; `ttlSeconds?`: `number`; \}; \} | - | packages/server/src/config.ts:315 |
| `config.server.stream.disconnectGracePeriodMs?` | `public` | `number` | - | packages/server/src/config.ts:263 |
| `config.server.stream.disconnectPolicy?` | `public` | `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"` | - | packages/server/src/config.ts:260 |
| `config.server.stream.perConnectionQueueLimit?` | `public` | `number` | - | packages/server/src/config.ts:265 |
| `config.server.stream.replayBuffer?` | `public` | \{ `maxEvents?`: `number`; `pruneIntervalSeconds?`: `number`; `ttlSeconds?`: `number`; \} | - | packages/server/src/config.ts:264 |
| `config.server.stream.replayBuffer.maxEvents?` | `public` | `number` | - | packages/server/src/config.ts:249 |
| `config.server.stream.replayBuffer.pruneIntervalSeconds?` | `public` | `number` | - | packages/server/src/config.ts:253 |
| `config.server.stream.replayBuffer.ttlSeconds?` | `public` | `number` | - | packages/server/src/config.ts:250 |
| `config.server.tlsTerminatedUpstream?` | `public` | `boolean` | - | packages/server/src/config.ts:314 |
| `config.server.trustProxy?` | `public` | `boolean` | - | packages/server/src/config.ts:313 |
| `config.server.ws?` | `public` | \{ `commentarySanitization?`: \{ `applyToEvents?`: `string`[]; `policy?`: `"wrap"` \| `"strip"` \| `"pass-through"`; \}; `enabled?`: `boolean`; `path?`: `string`; `ticketTtlMs?`: `number`; \} | - | packages/server/src/config.ts:316 |
| `config.server.ws.commentarySanitization?` | `public` | \{ `applyToEvents?`: `string`[]; `policy?`: `"wrap"` \| `"strip"` \| `"pass-through"`; \} | - | packages/server/src/config.ts:289 |
| `config.server.ws.commentarySanitization.applyToEvents?` | `public` | `string`[] | - | packages/server/src/config.ts:273 |
| `config.server.ws.commentarySanitization.policy?` | `public` | `"wrap"` \| `"strip"` \| `"pass-through"` | - | packages/server/src/config.ts:272 |
| `config.server.ws.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:282 |
| `config.server.ws.path?` | `public` | `string` | - | packages/server/src/config.ts:283 |
| `config.server.ws.ticketTtlMs?` | `public` | `number` | - | packages/server/src/config.ts:284 |
| `config.storage?` | `public` | \{ `encryption?`: \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; \}; `mode?`: `"server"` \| `"lib"`; `path?`: `string`; `walCheckpointIntervalMs?`: `number`; \} | - | packages/server/src/config.ts:454 |
| `config.storage.encryption?` | `public` | \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; \} | - | packages/server/src/config.ts:336 |
| `config.storage.encryption.cipher?` | `public` | `string` | - | packages/server/src/config.ts:325 |
| `config.storage.encryption.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:324 |
| `config.storage.encryption.passphraseRef?` | `public` | `string` | - | packages/server/src/config.ts:326 |
| `config.storage.mode?` | `public` | `"server"` \| `"lib"` | - | packages/server/src/config.ts:334 |
| `config.storage.path?` | `public` | `string` | - | packages/server/src/config.ts:333 |
| `config.storage.walCheckpointIntervalMs?` | `public` | `number` | - | packages/server/src/config.ts:335 |
| <a id="property-consolidator"></a> `consolidator?` | `readonly` | [`ConsolidatorLike`](/api/@graphorin/server/interfaces/ConsolidatorLike.md) | Optional consolidator surface (`@graphorin/memory`). Phase 14c starts/stops the runtime alongside the server lifecycle and surfaces its status through `/v1/health`. | packages/server/src/app.ts:151 |
| <a id="property-healthprobes"></a> `healthProbes?` | `readonly` | () => \| [`HealthCheckOptions`](/api/@graphorin/server/interfaces/HealthCheckOptions.md) \| `Promise`\&lt;[`HealthCheckOptions`](/api/@graphorin/server/interfaces/HealthCheckOptions.md)\&gt; | Optional probes that augment `/v1/health`. Provided by consumer code (e.g. `embedder` provides `embedderLoaded`). | packages/server/src/app.ts:182 |
| <a id="property-hooks"></a> `hooks?` | `readonly` | [`LifecycleHooks`](/api/@graphorin/server/interfaces/LifecycleHooks.md) | Lifecycle hook overrides. | packages/server/src/app.ts:190 |
| <a id="property-mcp"></a> `mcp?` | `readonly` | [`McpApi`](/api/@graphorin/server/interfaces/McpApi.md) | - | packages/server/src/app.ts:144 |
| <a id="property-memory"></a> `memory?` | `readonly` | [`MemoryApi`](/api/@graphorin/server/interfaces/MemoryApi.md) | - | packages/server/src/app.ts:142 |
| <a id="property-metricregistry"></a> `metricRegistry?` | `readonly` | [`MetricRegistry`](/api/@graphorin/server/classes/MetricRegistry.md) | Optional Prometheus metric registry override. When omitted, the server constructs the canonical registry from [createServerMetricRegistry](/api/@graphorin/server/functions/createServerMetricRegistry.md). | packages/server/src/app.ts:188 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Wall-clock provider for tests. | packages/server/src/app.ts:192 |
| <a id="property-probecipherpeer"></a> `probeCipherPeer?` | `readonly` | () => `Promise`\&lt;`void`\&gt; | Override the cipher peer probe. Tests inject a stub. | packages/server/src/app.ts:194 |
| <a id="property-replay"></a> `replay?` | `readonly` | [`ReplayApi`](/api/@graphorin/server/interfaces/ReplayApi.md) | Optional replay API consumed by the scope-enforced replay endpoints. Phase 14c. | packages/server/src/app.ts:177 |
| <a id="property-runs"></a> `runs?` | `readonly` | [`RunStateTracker`](/api/@graphorin/server/classes/RunStateTracker.md) | Optional pre-built tracker. Tests inject deterministic timing. | packages/server/src/app.ts:136 |
| <a id="property-sessions"></a> `sessions?` | `readonly` | [`SessionApi`](/api/@graphorin/server/interfaces/SessionApi.md) | Optional in-process domain adapters wired into REST routes. | packages/server/src/app.ts:141 |
| <a id="property-skills"></a> `skills?` | `readonly` | [`SkillsApi`](/api/@graphorin/server/interfaces/SkillsApi.md) | - | packages/server/src/app.ts:143 |
| <a id="property-skiphardening"></a> `skipHardening?` | `readonly` | `boolean` | Skip `applyProcessHardening` (tests). | packages/server/src/app.ts:198 |
| <a id="property-skiplisten"></a> `skipListen?` | `readonly` | `boolean` | Skip starting the actual listener (tests). | packages/server/src/app.ts:200 |
| <a id="property-store"></a> `store?` | `readonly` | [`GraphorinSqliteStore`](/api/@graphorin/store-sqlite/interfaces/GraphorinSqliteStore.md) | Pre-built SQLite store. Tests inject an in-memory store. The caller retains ownership: `stop()` never closes an injected store (E-21), so it can be shared across server restarts. Omit the option to let the server create - and close - its own store. | packages/server/src/app.ts:134 |
| <a id="property-triggers"></a> `triggers?` | `readonly` | [`TriggersDaemonInput`](/api/@graphorin/server/type-aliases/TriggersDaemonInput.md) | Optional triggers daemon - pass an existing one (e.g. built from `createScheduler`) or a triggers configuration the server should wrap with the daemon adapter. | packages/server/src/app.ts:157 |
| <a id="property-validatedconfig"></a> `validatedConfig?` | `readonly` | [`ServerConfigSpec`](/api/@graphorin/server/config/interfaces/ServerConfigSpec.md) | Optional pre-validated config. When supplied, `config` is ignored and the schema validation step is skipped. Useful for tests + the `graphorin migrate` CLI command which bypasses the listener. | packages/server/src/app.ts:127 |
| <a id="property-version"></a> `version?` | `readonly` | `string` | Override the package version reported on `/v1/health`. | packages/server/src/app.ts:196 |
| <a id="property-workflows"></a> `workflows?` | `readonly` | [`WorkflowRegistry`](/api/@graphorin/server/registry/classes/WorkflowRegistry.md) | - | packages/server/src/app.ts:139 |
| <a id="property-workflowtimers"></a> `workflowTimers?` | `readonly` | [`WorkflowTimersInput`](/api/@graphorin/server/type-aliases/WorkflowTimersInput.md) | Optional workflow durable-timer surface - pass a `createTimerDriver(...)` built over your workflows + checkpoint stores (`{ driver }`), or a pre-built daemon. The server starts and stops it with the lifecycle and reports it on `/v1/health`. | packages/server/src/app.ts:164 |
