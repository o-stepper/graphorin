[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / CreateServerOptions

# Interface: CreateServerOptions

Defined in: packages/server/src/app.ts:107

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agents"></a> `agents?` | `readonly` | [`AgentRegistry`](/api/@graphorin/server/registry/classes/AgentRegistry.md) | Optional pre-built registries. | packages/server/src/app.ts:121 |
| <a id="property-audit"></a> `audit?` | `readonly` | [`AuditApi`](/api/@graphorin/server/interfaces/AuditApi.md) | - | packages/server/src/app.ts:128 |
| <a id="property-config"></a> `config?` | `readonly` | \{ `audit?`: \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; `path?`: `string`; `toolEvents?`: `"all"` \| `"off"` \| `"security"`; \}; `auth?`: \{ `kind?`: `"none"` \| `"token"`; `pepperRef?`: `string`; `perIpFailureThreshold?`: `number`; `perIpLockoutMs?`: `number`; `tokenEnvironments?`: `string`[]; `tokenPrefix?`: `string`; \}; `hardening?`: \{ `applyOnStart?`: `boolean`; `refuseRoot?`: `boolean`; `umask?`: `number`; \}; `health?`: \{ `walWarnThresholdBytes?`: `number`; \}; `metrics?`: \{ `enabled?`: `boolean`; `path?`: `string`; `requireAuth?`: `boolean`; \}; `observability?`: \{ `logger?`: `"json"` \| `"pretty"` \| `"silent"`; \}; `retention?`: \{ `auditDays?`: `number`; `consolidatorRunsDays?`: `number`; `dlqExhaustedDays?`: `number`; `enabled?`: `boolean`; `idempotency?`: `boolean`; `intervalMs?`: `number`; `memoryHistoryDays?`: `number`; `sessionsClosedOnly?`: `boolean`; `sessionsDays?`: `number`; `spansDays?`: `number`; `workflowThreadsDays?`: `number`; \}; `secrets?`: \{ `source?`: `"auto"` \| `"keyring"` \| `"encrypted-file"` \| `"env"`; `strict?`: `boolean`; \}; `server?`: \{ `basePath?`: `string`; `cors?`: \{ `allowCredentials?`: `boolean`; `allowHeaders?`: `string`[]; `allowMethods?`: `string`[]; `allowOrigins?`: `string`[]; `maxAgeSeconds?`: `number`; \}; `csrf?`: \{ `cookieName?`: `string`; `enabled?`: `boolean`; `headerName?`: `string`; `safeMethods?`: `string`[]; \}; `host?`: `string`; `idempotency?`: \{ `checkBodyFingerprint?`: `boolean`; `enabled?`: `boolean`; `lruCacheSize?`: `number`; `requireKey?`: `"off"` \| `"warn"` \| `"enforce"`; `ttlSeconds?`: `number`; \}; `port?`: `number`; `rateLimit?`: \{ `enabled?`: `boolean`; `perIpRequests?`: `number`; `windowMs?`: `number`; \}; `shutdown?`: \{ `drainTimeoutMs?`: `number`; \}; `sse?`: \{ `enabled?`: `boolean`; `keepAliveMs?`: `number`; `path?`: `string`; \}; `stream?`: \{ `disconnectGracePeriodMs?`: `number`; `disconnectPolicy?`: `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"`; `perConnectionQueueLimit?`: `number`; `replayBuffer?`: \{ `maxEvents?`: `number`; `pruneIntervalSeconds?`: `number`; `ttlSeconds?`: `number`; \}; \}; `trustProxy?`: `boolean`; `ws?`: \{ `commentarySanitization?`: \{ `applyToEvents?`: `string`[]; `policy?`: `"wrap"` \| `"strip"` \| `"pass-through"`; \}; `enabled?`: `boolean`; `path?`: `string`; `ticketTtlMs?`: `number`; \}; \}; `storage?`: \{ `encryption?`: \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; \}; `mode?`: `"server"` \| `"lib"`; `path?`: `string`; `walCheckpointIntervalMs?`: `number`; \}; \} | Loaded `graphorin.config.ts` payload - see `defineConfig({...})`. | packages/server/src/app.ts:109 |
| `config.audit?` | `public` | \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; `path?`: `string`; `toolEvents?`: `"all"` \| `"off"` \| `"security"`; \} | - | packages/server/src/config.ts:424 |
| `config.audit.cipher?` | `public` | `string` | - | packages/server/src/config.ts:349 |
| `config.audit.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:346 |
| `config.audit.passphraseRef?` | `public` | `string` | - | packages/server/src/config.ts:348 |
| `config.audit.path?` | `public` | `string` | - | packages/server/src/config.ts:347 |
| `config.audit.toolEvents?` | `public` | `"all"` \| `"off"` \| `"security"` | - | packages/server/src/config.ts:351 |
| `config.auth?` | `public` | \{ `kind?`: `"none"` \| `"token"`; `pepperRef?`: `string`; `perIpFailureThreshold?`: `number`; `perIpLockoutMs?`: `number`; `tokenEnvironments?`: `string`[]; `tokenPrefix?`: `string`; \} | - | packages/server/src/config.ts:426 |
| `config.auth.kind?` | `public` | `"none"` \| `"token"` | - | packages/server/src/config.ts:366 |
| `config.auth.pepperRef?` | `public` | `string` | - | packages/server/src/config.ts:367 |
| `config.auth.perIpFailureThreshold?` | `public` | `number` | - | packages/server/src/config.ts:370 |
| `config.auth.perIpLockoutMs?` | `public` | `number` | - | packages/server/src/config.ts:371 |
| `config.auth.tokenEnvironments?` | `public` | `string`[] | - | packages/server/src/config.ts:369 |
| `config.auth.tokenPrefix?` | `public` | `string` | - | packages/server/src/config.ts:368 |
| `config.hardening?` | `public` | \{ `applyOnStart?`: `boolean`; `refuseRoot?`: `boolean`; `umask?`: `number`; \} | - | packages/server/src/config.ts:428 |
| `config.hardening.applyOnStart?` | `public` | `boolean` | - | packages/server/src/config.ts:385 |
| `config.hardening.refuseRoot?` | `public` | `boolean` | - | packages/server/src/config.ts:386 |
| `config.hardening.umask?` | `public` | `number` | - | packages/server/src/config.ts:387 |
| `config.health?` | `public` | \{ `walWarnThresholdBytes?`: `number`; \} | - | packages/server/src/config.ts:430 |
| `config.health.walWarnThresholdBytes?` | `public` | `number` | - | packages/server/src/config.ts:403 |
| `config.metrics?` | `public` | \{ `enabled?`: `boolean`; `path?`: `string`; `requireAuth?`: `boolean`; \} | - | packages/server/src/config.ts:429 |
| `config.metrics.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:394 |
| `config.metrics.path?` | `public` | `string` | - | packages/server/src/config.ts:395 |
| `config.metrics.requireAuth?` | `public` | `boolean` | - | packages/server/src/config.ts:396 |
| `config.observability?` | `public` | \{ `logger?`: `"json"` \| `"pretty"` \| `"silent"`; \} | - | packages/server/src/config.ts:427 |
| `config.observability.logger?` | `public` | `"json"` \| `"pretty"` \| `"silent"` | - | packages/server/src/config.ts:378 |
| `config.retention?` | `public` | \{ `auditDays?`: `number`; `consolidatorRunsDays?`: `number`; `dlqExhaustedDays?`: `number`; `enabled?`: `boolean`; `idempotency?`: `boolean`; `intervalMs?`: `number`; `memoryHistoryDays?`: `number`; `sessionsClosedOnly?`: `boolean`; `sessionsDays?`: `number`; `spansDays?`: `number`; `workflowThreadsDays?`: `number`; \} | - | packages/server/src/config.ts:423 |
| `config.retention.auditDays?` | `public` | `number` | - | packages/server/src/config.ts:339 |
| `config.retention.consolidatorRunsDays?` | `public` | `number` | - | packages/server/src/config.ts:332 |
| `config.retention.dlqExhaustedDays?` | `public` | `number` | - | packages/server/src/config.ts:333 |
| `config.retention.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:325 |
| `config.retention.idempotency?` | `public` | `boolean` | - | packages/server/src/config.ts:334 |
| `config.retention.intervalMs?` | `public` | `number` | - | packages/server/src/config.ts:326 |
| `config.retention.memoryHistoryDays?` | `public` | `number` | - | packages/server/src/config.ts:337 |
| `config.retention.sessionsClosedOnly?` | `public` | `boolean` | - | packages/server/src/config.ts:336 |
| `config.retention.sessionsDays?` | `public` | `number` | - | packages/server/src/config.ts:335 |
| `config.retention.spansDays?` | `public` | `number` | - | packages/server/src/config.ts:331 |
| `config.retention.workflowThreadsDays?` | `public` | `number` | - | packages/server/src/config.ts:338 |
| `config.secrets?` | `public` | \{ `source?`: `"auto"` \| `"keyring"` \| `"encrypted-file"` \| `"env"`; `strict?`: `boolean`; \} | - | packages/server/src/config.ts:425 |
| `config.secrets.source?` | `public` | `"auto"` \| `"keyring"` \| `"encrypted-file"` \| `"env"` | - | packages/server/src/config.ts:358 |
| `config.secrets.strict?` | `public` | `boolean` | - | packages/server/src/config.ts:359 |
| `config.server?` | `public` | \{ `basePath?`: `string`; `cors?`: \{ `allowCredentials?`: `boolean`; `allowHeaders?`: `string`[]; `allowMethods?`: `string`[]; `allowOrigins?`: `string`[]; `maxAgeSeconds?`: `number`; \}; `csrf?`: \{ `cookieName?`: `string`; `enabled?`: `boolean`; `headerName?`: `string`; `safeMethods?`: `string`[]; \}; `host?`: `string`; `idempotency?`: \{ `checkBodyFingerprint?`: `boolean`; `enabled?`: `boolean`; `lruCacheSize?`: `number`; `requireKey?`: `"off"` \| `"warn"` \| `"enforce"`; `ttlSeconds?`: `number`; \}; `port?`: `number`; `rateLimit?`: \{ `enabled?`: `boolean`; `perIpRequests?`: `number`; `windowMs?`: `number`; \}; `shutdown?`: \{ `drainTimeoutMs?`: `number`; \}; `sse?`: \{ `enabled?`: `boolean`; `keepAliveMs?`: `number`; `path?`: `string`; \}; `stream?`: \{ `disconnectGracePeriodMs?`: `number`; `disconnectPolicy?`: `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"`; `perConnectionQueueLimit?`: `number`; `replayBuffer?`: \{ `maxEvents?`: `number`; `pruneIntervalSeconds?`: `number`; `ttlSeconds?`: `number`; \}; \}; `trustProxy?`: `boolean`; `ws?`: \{ `commentarySanitization?`: \{ `applyToEvents?`: `string`[]; `policy?`: `"wrap"` \| `"strip"` \| `"pass-through"`; \}; `enabled?`: `boolean`; `path?`: `string`; `ticketTtlMs?`: `number`; \}; \} | - | packages/server/src/config.ts:421 |
| `config.server.basePath?` | `public` | `string` | - | packages/server/src/config.ts:282 |
| `config.server.cors?` | `public` | \{ `allowCredentials?`: `boolean`; `allowHeaders?`: `string`[]; `allowMethods?`: `string`[]; `allowOrigins?`: `string`[]; `maxAgeSeconds?`: `number`; \} | - | packages/server/src/config.ts:283 |
| `config.server.cors.allowCredentials?` | `public` | `boolean` | - | packages/server/src/config.ts:175 |
| `config.server.cors.allowHeaders?` | `public` | `string`[] | - | packages/server/src/config.ts:177 |
| `config.server.cors.allowMethods?` | `public` | `string`[] | - | packages/server/src/config.ts:176 |
| `config.server.cors.allowOrigins?` | `public` | `string`[] | - | packages/server/src/config.ts:174 |
| `config.server.cors.maxAgeSeconds?` | `public` | `number` | - | packages/server/src/config.ts:180 |
| `config.server.csrf?` | `public` | \{ `cookieName?`: `string`; `enabled?`: `boolean`; `headerName?`: `string`; `safeMethods?`: `string`[]; \} | - | packages/server/src/config.ts:284 |
| `config.server.csrf.cookieName?` | `public` | `string` | - | packages/server/src/config.ts:188 |
| `config.server.csrf.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:187 |
| `config.server.csrf.headerName?` | `public` | `string` | - | packages/server/src/config.ts:189 |
| `config.server.csrf.safeMethods?` | `public` | `string`[] | - | packages/server/src/config.ts:190 |
| `config.server.host?` | `public` | `string` | - | packages/server/src/config.ts:280 |
| `config.server.idempotency?` | `public` | \{ `checkBodyFingerprint?`: `boolean`; `enabled?`: `boolean`; `lruCacheSize?`: `number`; `requireKey?`: `"off"` \| `"warn"` \| `"enforce"`; `ttlSeconds?`: `number`; \} | - | packages/server/src/config.ts:286 |
| `config.server.idempotency.checkBodyFingerprint?` | `public` | `boolean` | - | packages/server/src/config.ts:209 |
| `config.server.idempotency.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:206 |
| `config.server.idempotency.lruCacheSize?` | `public` | `number` | - | packages/server/src/config.ts:210 |
| `config.server.idempotency.requireKey?` | `public` | `"off"` \| `"warn"` \| `"enforce"` | - | packages/server/src/config.ts:207 |
| `config.server.idempotency.ttlSeconds?` | `public` | `number` | - | packages/server/src/config.ts:208 |
| `config.server.port?` | `public` | `number` | - | packages/server/src/config.ts:281 |
| `config.server.rateLimit?` | `public` | \{ `enabled?`: `boolean`; `perIpRequests?`: `number`; `windowMs?`: `number`; \} | - | packages/server/src/config.ts:285 |
| `config.server.rateLimit.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:197 |
| `config.server.rateLimit.perIpRequests?` | `public` | `number` | - | packages/server/src/config.ts:199 |
| `config.server.rateLimit.windowMs?` | `public` | `number` | - | packages/server/src/config.ts:198 |
| `config.server.shutdown?` | `public` | \{ `drainTimeoutMs?`: `number`; \} | - | packages/server/src/config.ts:287 |
| `config.server.shutdown.drainTimeoutMs?` | `public` | `number` | - | packages/server/src/config.ts:217 |
| `config.server.sse?` | `public` | \{ `enabled?`: `boolean`; `keepAliveMs?`: `number`; `path?`: `string`; \} | - | packages/server/src/config.ts:291 |
| `config.server.sse.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:271 |
| `config.server.sse.keepAliveMs?` | `public` | `number` | - | packages/server/src/config.ts:273 |
| `config.server.sse.path?` | `public` | `string` | - | packages/server/src/config.ts:272 |
| `config.server.stream?` | `public` | \{ `disconnectGracePeriodMs?`: `number`; `disconnectPolicy?`: `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"`; `perConnectionQueueLimit?`: `number`; `replayBuffer?`: \{ `maxEvents?`: `number`; `pruneIntervalSeconds?`: `number`; `ttlSeconds?`: `number`; \}; \} | - | packages/server/src/config.ts:289 |
| `config.server.stream.disconnectGracePeriodMs?` | `public` | `number` | - | packages/server/src/config.ts:238 |
| `config.server.stream.disconnectPolicy?` | `public` | `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"` | - | packages/server/src/config.ts:235 |
| `config.server.stream.perConnectionQueueLimit?` | `public` | `number` | - | packages/server/src/config.ts:240 |
| `config.server.stream.replayBuffer?` | `public` | \{ `maxEvents?`: `number`; `pruneIntervalSeconds?`: `number`; `ttlSeconds?`: `number`; \} | - | packages/server/src/config.ts:239 |
| `config.server.stream.replayBuffer.maxEvents?` | `public` | `number` | - | packages/server/src/config.ts:224 |
| `config.server.stream.replayBuffer.pruneIntervalSeconds?` | `public` | `number` | - | packages/server/src/config.ts:228 |
| `config.server.stream.replayBuffer.ttlSeconds?` | `public` | `number` | - | packages/server/src/config.ts:225 |
| `config.server.trustProxy?` | `public` | `boolean` | - | packages/server/src/config.ts:288 |
| `config.server.ws?` | `public` | \{ `commentarySanitization?`: \{ `applyToEvents?`: `string`[]; `policy?`: `"wrap"` \| `"strip"` \| `"pass-through"`; \}; `enabled?`: `boolean`; `path?`: `string`; `ticketTtlMs?`: `number`; \} | - | packages/server/src/config.ts:290 |
| `config.server.ws.commentarySanitization?` | `public` | \{ `applyToEvents?`: `string`[]; `policy?`: `"wrap"` \| `"strip"` \| `"pass-through"`; \} | - | packages/server/src/config.ts:264 |
| `config.server.ws.commentarySanitization.applyToEvents?` | `public` | `string`[] | - | packages/server/src/config.ts:248 |
| `config.server.ws.commentarySanitization.policy?` | `public` | `"wrap"` \| `"strip"` \| `"pass-through"` | - | packages/server/src/config.ts:247 |
| `config.server.ws.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:257 |
| `config.server.ws.path?` | `public` | `string` | - | packages/server/src/config.ts:258 |
| `config.server.ws.ticketTtlMs?` | `public` | `number` | - | packages/server/src/config.ts:259 |
| `config.storage?` | `public` | \{ `encryption?`: \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; \}; `mode?`: `"server"` \| `"lib"`; `path?`: `string`; `walCheckpointIntervalMs?`: `number`; \} | - | packages/server/src/config.ts:422 |
| `config.storage.encryption?` | `public` | \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; \} | - | packages/server/src/config.ts:310 |
| `config.storage.encryption.cipher?` | `public` | `string` | - | packages/server/src/config.ts:299 |
| `config.storage.encryption.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:298 |
| `config.storage.encryption.passphraseRef?` | `public` | `string` | - | packages/server/src/config.ts:300 |
| `config.storage.mode?` | `public` | `"server"` \| `"lib"` | - | packages/server/src/config.ts:308 |
| `config.storage.path?` | `public` | `string` | - | packages/server/src/config.ts:307 |
| `config.storage.walCheckpointIntervalMs?` | `public` | `number` | - | packages/server/src/config.ts:309 |
| <a id="property-consolidator"></a> `consolidator?` | `readonly` | [`ConsolidatorLike`](/api/@graphorin/server/interfaces/ConsolidatorLike.md) | Optional consolidator surface (`@graphorin/memory`). Phase 14c starts/stops the runtime alongside the server lifecycle and surfaces its status through `/v1/health`. | packages/server/src/app.ts:134 |
| <a id="property-healthprobes"></a> `healthProbes?` | `readonly` | () => \| [`HealthCheckOptions`](/api/@graphorin/server/interfaces/HealthCheckOptions.md) \| `Promise`\<[`HealthCheckOptions`](/api/@graphorin/server/interfaces/HealthCheckOptions.md)\> | Optional probes that augment `/v1/health`. Provided by consumer code (e.g. `embedder` provides `embedderLoaded`). | packages/server/src/app.ts:157 |
| <a id="property-hooks"></a> `hooks?` | `readonly` | [`LifecycleHooks`](/api/@graphorin/server/interfaces/LifecycleHooks.md) | Lifecycle hook overrides. | packages/server/src/app.ts:165 |
| <a id="property-mcp"></a> `mcp?` | `readonly` | [`McpApi`](/api/@graphorin/server/interfaces/McpApi.md) | - | packages/server/src/app.ts:127 |
| <a id="property-memory"></a> `memory?` | `readonly` | [`MemoryApi`](/api/@graphorin/server/interfaces/MemoryApi.md) | - | packages/server/src/app.ts:125 |
| <a id="property-metricregistry"></a> `metricRegistry?` | `readonly` | [`MetricRegistry`](/api/@graphorin/server/classes/MetricRegistry.md) | Optional Prometheus metric registry override. When omitted, the server constructs the canonical registry from [createServerMetricRegistry](/api/@graphorin/server/functions/createServerMetricRegistry.md). | packages/server/src/app.ts:163 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Wall-clock provider for tests. | packages/server/src/app.ts:167 |
| <a id="property-probecipherpeer"></a> `probeCipherPeer?` | `readonly` | () => `Promise`\<`void`\> | Override the cipher peer probe. Tests inject a stub. | packages/server/src/app.ts:169 |
| <a id="property-replay"></a> `replay?` | `readonly` | [`ReplayApi`](/api/@graphorin/server/interfaces/ReplayApi.md) | Optional replay API consumed by the scope-enforced replay endpoints. Phase 14c. | packages/server/src/app.ts:152 |
| <a id="property-runs"></a> `runs?` | `readonly` | [`RunStateTracker`](/api/@graphorin/server/classes/RunStateTracker.md) | Optional pre-built tracker. Tests inject deterministic timing. | packages/server/src/app.ts:119 |
| <a id="property-sessions"></a> `sessions?` | `readonly` | [`SessionApi`](/api/@graphorin/server/interfaces/SessionApi.md) | Optional in-process domain adapters wired into REST routes. | packages/server/src/app.ts:124 |
| <a id="property-skills"></a> `skills?` | `readonly` | [`SkillsApi`](/api/@graphorin/server/interfaces/SkillsApi.md) | - | packages/server/src/app.ts:126 |
| <a id="property-skiphardening"></a> `skipHardening?` | `readonly` | `boolean` | Skip `applyProcessHardening` (tests). | packages/server/src/app.ts:173 |
| <a id="property-skiplisten"></a> `skipListen?` | `readonly` | `boolean` | Skip starting the actual listener (tests). | packages/server/src/app.ts:175 |
| <a id="property-store"></a> `store?` | `readonly` | [`GraphorinSqliteStore`](/api/@graphorin/store-sqlite/interfaces/GraphorinSqliteStore.md) | Pre-built SQLite store. Tests inject an in-memory store. | packages/server/src/app.ts:117 |
| <a id="property-triggers"></a> `triggers?` | `readonly` | [`TriggersDaemonInput`](/api/@graphorin/server/type-aliases/TriggersDaemonInput.md) | Optional triggers daemon - pass an existing one (e.g. built from `createScheduler`) or a triggers configuration the server should wrap with the daemon adapter. | packages/server/src/app.ts:140 |
| <a id="property-validatedconfig"></a> `validatedConfig?` | `readonly` | [`ServerConfigSpec`](/api/@graphorin/server/config/interfaces/ServerConfigSpec.md) | Optional pre-validated config. When supplied, `config` is ignored and the schema validation step is skipped. Useful for tests + the `graphorin migrate` CLI command which bypasses the listener. | packages/server/src/app.ts:115 |
| <a id="property-version"></a> `version?` | `readonly` | `string` | Override the package version reported on `/v1/health`. | packages/server/src/app.ts:171 |
| <a id="property-workflows"></a> `workflows?` | `readonly` | [`WorkflowRegistry`](/api/@graphorin/server/registry/classes/WorkflowRegistry.md) | - | packages/server/src/app.ts:122 |
| <a id="property-workflowtimers"></a> `workflowTimers?` | `readonly` | [`WorkflowTimersInput`](/api/@graphorin/server/type-aliases/WorkflowTimersInput.md) | W-032: optional workflow durable-timer surface - pass a `createTimerDriver(...)` built over your workflows + checkpoint stores (`{ driver }`), or a pre-built daemon. The server starts and stops it with the lifecycle and reports it on `/v1/health`. | packages/server/src/app.ts:147 |
