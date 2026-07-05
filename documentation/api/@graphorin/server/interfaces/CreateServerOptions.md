[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / CreateServerOptions

# Interface: CreateServerOptions

Defined in: packages/server/src/app.ts:101

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-agents"></a> `agents?` | `readonly` | [`AgentRegistry`](/api/@graphorin/server/registry/classes/AgentRegistry.md) | Optional pre-built registries. | packages/server/src/app.ts:115 |
| <a id="property-audit"></a> `audit?` | `readonly` | [`AuditApi`](/api/@graphorin/server/interfaces/AuditApi.md) | - | packages/server/src/app.ts:122 |
| <a id="property-config"></a> `config?` | `readonly` | \{ `audit?`: \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; `path?`: `string`; \}; `auth?`: \{ `kind?`: `"none"` \| `"token"`; `pepperRef?`: `string`; `perIpFailureThreshold?`: `number`; `perIpLockoutMs?`: `number`; `tokenEnvironments?`: `string`[]; `tokenPrefix?`: `string`; \}; `hardening?`: \{ `applyOnStart?`: `boolean`; `refuseRoot?`: `boolean`; `umask?`: `number`; \}; `health?`: \{ `walWarnThresholdBytes?`: `number`; \}; `metrics?`: \{ `enabled?`: `boolean`; `path?`: `string`; `requireAuth?`: `boolean`; \}; `observability?`: \{ `logger?`: `"json"` \| `"pretty"` \| `"silent"`; \}; `secrets?`: \{ `source?`: `"auto"` \| `"keyring"` \| `"encrypted-file"` \| `"env"`; `strict?`: `boolean`; \}; `server?`: \{ `basePath?`: `string`; `cors?`: \{ `allowCredentials?`: `boolean`; `allowHeaders?`: `string`[]; `allowMethods?`: `string`[]; `allowOrigins?`: `string`[]; `maxAgeSeconds?`: `number`; \}; `csrf?`: \{ `cookieName?`: `string`; `enabled?`: `boolean`; `headerName?`: `string`; `safeMethods?`: `string`[]; \}; `host?`: `string`; `idempotency?`: \{ `checkBodyFingerprint?`: `boolean`; `enabled?`: `boolean`; `lruCacheSize?`: `number`; `requireKey?`: `"off"` \| `"warn"` \| `"enforce"`; `ttlSeconds?`: `number`; \}; `port?`: `number`; `rateLimit?`: \{ `enabled?`: `boolean`; `perIpRequests?`: `number`; `windowMs?`: `number`; \}; `shutdown?`: \{ `drainTimeoutMs?`: `number`; \}; `sse?`: \{ `enabled?`: `boolean`; `keepAliveMs?`: `number`; `path?`: `string`; \}; `stream?`: \{ `disconnectGracePeriodMs?`: `number`; `disconnectPolicy?`: `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"`; `perConnectionQueueLimit?`: `number`; `replayBuffer?`: \{ `maxEvents?`: `number`; `pruneIntervalSeconds?`: `number`; `ttlSeconds?`: `number`; \}; \}; `trustProxy?`: `boolean`; `ws?`: \{ `commentarySanitization?`: \{ `applyToEvents?`: `string`[]; `policy?`: `"wrap"` \| `"strip"` \| `"pass-through"`; \}; `enabled?`: `boolean`; `path?`: `string`; `ticketTtlMs?`: `number`; \}; \}; `storage?`: \{ `encryption?`: \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; \}; `mode?`: `"server"` \| `"lib"`; `path?`: `string`; `walCheckpointIntervalMs?`: `number`; \}; \} | Loaded `graphorin.config.ts` payload - see `defineConfig({...})`. | packages/server/src/app.ts:103 |
| `config.audit?` | `public` | \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; `path?`: `string`; \} | - | packages/server/src/config.ts:371 |
| `config.audit.cipher?` | `public` | `string` | - | packages/server/src/config.ts:299 |
| `config.audit.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:296 |
| `config.audit.passphraseRef?` | `public` | `string` | - | packages/server/src/config.ts:298 |
| `config.audit.path?` | `public` | `string` | - | packages/server/src/config.ts:297 |
| `config.auth?` | `public` | \{ `kind?`: `"none"` \| `"token"`; `pepperRef?`: `string`; `perIpFailureThreshold?`: `number`; `perIpLockoutMs?`: `number`; `tokenEnvironments?`: `string`[]; `tokenPrefix?`: `string`; \} | - | packages/server/src/config.ts:373 |
| `config.auth.kind?` | `public` | `"none"` \| `"token"` | - | packages/server/src/config.ts:314 |
| `config.auth.pepperRef?` | `public` | `string` | - | packages/server/src/config.ts:315 |
| `config.auth.perIpFailureThreshold?` | `public` | `number` | - | packages/server/src/config.ts:318 |
| `config.auth.perIpLockoutMs?` | `public` | `number` | - | packages/server/src/config.ts:319 |
| `config.auth.tokenEnvironments?` | `public` | `string`[] | - | packages/server/src/config.ts:317 |
| `config.auth.tokenPrefix?` | `public` | `string` | - | packages/server/src/config.ts:316 |
| `config.hardening?` | `public` | \{ `applyOnStart?`: `boolean`; `refuseRoot?`: `boolean`; `umask?`: `number`; \} | - | packages/server/src/config.ts:375 |
| `config.hardening.applyOnStart?` | `public` | `boolean` | - | packages/server/src/config.ts:333 |
| `config.hardening.refuseRoot?` | `public` | `boolean` | - | packages/server/src/config.ts:334 |
| `config.hardening.umask?` | `public` | `number` | - | packages/server/src/config.ts:335 |
| `config.health?` | `public` | \{ `walWarnThresholdBytes?`: `number`; \} | - | packages/server/src/config.ts:377 |
| `config.health.walWarnThresholdBytes?` | `public` | `number` | - | packages/server/src/config.ts:351 |
| `config.metrics?` | `public` | \{ `enabled?`: `boolean`; `path?`: `string`; `requireAuth?`: `boolean`; \} | - | packages/server/src/config.ts:376 |
| `config.metrics.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:342 |
| `config.metrics.path?` | `public` | `string` | - | packages/server/src/config.ts:343 |
| `config.metrics.requireAuth?` | `public` | `boolean` | - | packages/server/src/config.ts:344 |
| `config.observability?` | `public` | \{ `logger?`: `"json"` \| `"pretty"` \| `"silent"`; \} | - | packages/server/src/config.ts:374 |
| `config.observability.logger?` | `public` | `"json"` \| `"pretty"` \| `"silent"` | - | packages/server/src/config.ts:326 |
| `config.secrets?` | `public` | \{ `source?`: `"auto"` \| `"keyring"` \| `"encrypted-file"` \| `"env"`; `strict?`: `boolean`; \} | - | packages/server/src/config.ts:372 |
| `config.secrets.source?` | `public` | `"auto"` \| `"keyring"` \| `"encrypted-file"` \| `"env"` | - | packages/server/src/config.ts:306 |
| `config.secrets.strict?` | `public` | `boolean` | - | packages/server/src/config.ts:307 |
| `config.server?` | `public` | \{ `basePath?`: `string`; `cors?`: \{ `allowCredentials?`: `boolean`; `allowHeaders?`: `string`[]; `allowMethods?`: `string`[]; `allowOrigins?`: `string`[]; `maxAgeSeconds?`: `number`; \}; `csrf?`: \{ `cookieName?`: `string`; `enabled?`: `boolean`; `headerName?`: `string`; `safeMethods?`: `string`[]; \}; `host?`: `string`; `idempotency?`: \{ `checkBodyFingerprint?`: `boolean`; `enabled?`: `boolean`; `lruCacheSize?`: `number`; `requireKey?`: `"off"` \| `"warn"` \| `"enforce"`; `ttlSeconds?`: `number`; \}; `port?`: `number`; `rateLimit?`: \{ `enabled?`: `boolean`; `perIpRequests?`: `number`; `windowMs?`: `number`; \}; `shutdown?`: \{ `drainTimeoutMs?`: `number`; \}; `sse?`: \{ `enabled?`: `boolean`; `keepAliveMs?`: `number`; `path?`: `string`; \}; `stream?`: \{ `disconnectGracePeriodMs?`: `number`; `disconnectPolicy?`: `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"`; `perConnectionQueueLimit?`: `number`; `replayBuffer?`: \{ `maxEvents?`: `number`; `pruneIntervalSeconds?`: `number`; `ttlSeconds?`: `number`; \}; \}; `trustProxy?`: `boolean`; `ws?`: \{ `commentarySanitization?`: \{ `applyToEvents?`: `string`[]; `policy?`: `"wrap"` \| `"strip"` \| `"pass-through"`; \}; `enabled?`: `boolean`; `path?`: `string`; `ticketTtlMs?`: `number`; \}; \} | - | packages/server/src/config.ts:369 |
| `config.server.basePath?` | `public` | `string` | - | packages/server/src/config.ts:261 |
| `config.server.cors?` | `public` | \{ `allowCredentials?`: `boolean`; `allowHeaders?`: `string`[]; `allowMethods?`: `string`[]; `allowOrigins?`: `string`[]; `maxAgeSeconds?`: `number`; \} | - | packages/server/src/config.ts:262 |
| `config.server.cors.allowCredentials?` | `public` | `boolean` | - | packages/server/src/config.ts:154 |
| `config.server.cors.allowHeaders?` | `public` | `string`[] | - | packages/server/src/config.ts:156 |
| `config.server.cors.allowMethods?` | `public` | `string`[] | - | packages/server/src/config.ts:155 |
| `config.server.cors.allowOrigins?` | `public` | `string`[] | - | packages/server/src/config.ts:153 |
| `config.server.cors.maxAgeSeconds?` | `public` | `number` | - | packages/server/src/config.ts:159 |
| `config.server.csrf?` | `public` | \{ `cookieName?`: `string`; `enabled?`: `boolean`; `headerName?`: `string`; `safeMethods?`: `string`[]; \} | - | packages/server/src/config.ts:263 |
| `config.server.csrf.cookieName?` | `public` | `string` | - | packages/server/src/config.ts:167 |
| `config.server.csrf.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:166 |
| `config.server.csrf.headerName?` | `public` | `string` | - | packages/server/src/config.ts:168 |
| `config.server.csrf.safeMethods?` | `public` | `string`[] | - | packages/server/src/config.ts:169 |
| `config.server.host?` | `public` | `string` | - | packages/server/src/config.ts:259 |
| `config.server.idempotency?` | `public` | \{ `checkBodyFingerprint?`: `boolean`; `enabled?`: `boolean`; `lruCacheSize?`: `number`; `requireKey?`: `"off"` \| `"warn"` \| `"enforce"`; `ttlSeconds?`: `number`; \} | - | packages/server/src/config.ts:265 |
| `config.server.idempotency.checkBodyFingerprint?` | `public` | `boolean` | - | packages/server/src/config.ts:188 |
| `config.server.idempotency.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:185 |
| `config.server.idempotency.lruCacheSize?` | `public` | `number` | - | packages/server/src/config.ts:189 |
| `config.server.idempotency.requireKey?` | `public` | `"off"` \| `"warn"` \| `"enforce"` | - | packages/server/src/config.ts:186 |
| `config.server.idempotency.ttlSeconds?` | `public` | `number` | - | packages/server/src/config.ts:187 |
| `config.server.port?` | `public` | `number` | - | packages/server/src/config.ts:260 |
| `config.server.rateLimit?` | `public` | \{ `enabled?`: `boolean`; `perIpRequests?`: `number`; `windowMs?`: `number`; \} | - | packages/server/src/config.ts:264 |
| `config.server.rateLimit.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:176 |
| `config.server.rateLimit.perIpRequests?` | `public` | `number` | - | packages/server/src/config.ts:178 |
| `config.server.rateLimit.windowMs?` | `public` | `number` | - | packages/server/src/config.ts:177 |
| `config.server.shutdown?` | `public` | \{ `drainTimeoutMs?`: `number`; \} | - | packages/server/src/config.ts:266 |
| `config.server.shutdown.drainTimeoutMs?` | `public` | `number` | - | packages/server/src/config.ts:196 |
| `config.server.sse?` | `public` | \{ `enabled?`: `boolean`; `keepAliveMs?`: `number`; `path?`: `string`; \} | - | packages/server/src/config.ts:270 |
| `config.server.sse.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:250 |
| `config.server.sse.keepAliveMs?` | `public` | `number` | - | packages/server/src/config.ts:252 |
| `config.server.sse.path?` | `public` | `string` | - | packages/server/src/config.ts:251 |
| `config.server.stream?` | `public` | \{ `disconnectGracePeriodMs?`: `number`; `disconnectPolicy?`: `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"`; `perConnectionQueueLimit?`: `number`; `replayBuffer?`: \{ `maxEvents?`: `number`; `pruneIntervalSeconds?`: `number`; `ttlSeconds?`: `number`; \}; \} | - | packages/server/src/config.ts:268 |
| `config.server.stream.disconnectGracePeriodMs?` | `public` | `number` | - | packages/server/src/config.ts:217 |
| `config.server.stream.disconnectPolicy?` | `public` | `"continue"` \| `"pause-on-disconnect"` \| `"abort-on-disconnect"` | - | packages/server/src/config.ts:214 |
| `config.server.stream.perConnectionQueueLimit?` | `public` | `number` | - | packages/server/src/config.ts:219 |
| `config.server.stream.replayBuffer?` | `public` | \{ `maxEvents?`: `number`; `pruneIntervalSeconds?`: `number`; `ttlSeconds?`: `number`; \} | - | packages/server/src/config.ts:218 |
| `config.server.stream.replayBuffer.maxEvents?` | `public` | `number` | - | packages/server/src/config.ts:203 |
| `config.server.stream.replayBuffer.pruneIntervalSeconds?` | `public` | `number` | - | packages/server/src/config.ts:207 |
| `config.server.stream.replayBuffer.ttlSeconds?` | `public` | `number` | - | packages/server/src/config.ts:204 |
| `config.server.trustProxy?` | `public` | `boolean` | - | packages/server/src/config.ts:267 |
| `config.server.ws?` | `public` | \{ `commentarySanitization?`: \{ `applyToEvents?`: `string`[]; `policy?`: `"wrap"` \| `"strip"` \| `"pass-through"`; \}; `enabled?`: `boolean`; `path?`: `string`; `ticketTtlMs?`: `number`; \} | - | packages/server/src/config.ts:269 |
| `config.server.ws.commentarySanitization?` | `public` | \{ `applyToEvents?`: `string`[]; `policy?`: `"wrap"` \| `"strip"` \| `"pass-through"`; \} | - | packages/server/src/config.ts:243 |
| `config.server.ws.commentarySanitization.applyToEvents?` | `public` | `string`[] | - | packages/server/src/config.ts:227 |
| `config.server.ws.commentarySanitization.policy?` | `public` | `"wrap"` \| `"strip"` \| `"pass-through"` | - | packages/server/src/config.ts:226 |
| `config.server.ws.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:236 |
| `config.server.ws.path?` | `public` | `string` | - | packages/server/src/config.ts:237 |
| `config.server.ws.ticketTtlMs?` | `public` | `number` | - | packages/server/src/config.ts:238 |
| `config.storage?` | `public` | \{ `encryption?`: \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; \}; `mode?`: `"server"` \| `"lib"`; `path?`: `string`; `walCheckpointIntervalMs?`: `number`; \} | - | packages/server/src/config.ts:370 |
| `config.storage.encryption?` | `public` | \{ `cipher?`: `string`; `enabled?`: `boolean`; `passphraseRef?`: `string`; \} | - | packages/server/src/config.ts:289 |
| `config.storage.encryption.cipher?` | `public` | `string` | - | packages/server/src/config.ts:278 |
| `config.storage.encryption.enabled?` | `public` | `boolean` | - | packages/server/src/config.ts:277 |
| `config.storage.encryption.passphraseRef?` | `public` | `string` | - | packages/server/src/config.ts:279 |
| `config.storage.mode?` | `public` | `"server"` \| `"lib"` | - | packages/server/src/config.ts:287 |
| `config.storage.path?` | `public` | `string` | - | packages/server/src/config.ts:286 |
| `config.storage.walCheckpointIntervalMs?` | `public` | `number` | - | packages/server/src/config.ts:288 |
| <a id="property-consolidator"></a> `consolidator?` | `readonly` | [`ConsolidatorLike`](/api/@graphorin/server/interfaces/ConsolidatorLike.md) | Optional consolidator surface (`@graphorin/memory`). Phase 14c starts/stops the runtime alongside the server lifecycle and surfaces its status through `/v1/health`. | packages/server/src/app.ts:128 |
| <a id="property-healthprobes"></a> `healthProbes?` | `readonly` | () => \| [`HealthCheckOptions`](/api/@graphorin/server/interfaces/HealthCheckOptions.md) \| `Promise`\&lt;[`HealthCheckOptions`](/api/@graphorin/server/interfaces/HealthCheckOptions.md)\&gt; | Optional probes that augment `/v1/health`. Provided by consumer code (e.g. `embedder` provides `embedderLoaded`). | packages/server/src/app.ts:144 |
| <a id="property-hooks"></a> `hooks?` | `readonly` | [`LifecycleHooks`](/api/@graphorin/server/interfaces/LifecycleHooks.md) | Lifecycle hook overrides. | packages/server/src/app.ts:152 |
| <a id="property-mcp"></a> `mcp?` | `readonly` | [`McpApi`](/api/@graphorin/server/interfaces/McpApi.md) | - | packages/server/src/app.ts:121 |
| <a id="property-memory"></a> `memory?` | `readonly` | [`MemoryApi`](/api/@graphorin/server/interfaces/MemoryApi.md) | - | packages/server/src/app.ts:119 |
| <a id="property-metricregistry"></a> `metricRegistry?` | `readonly` | [`MetricRegistry`](/api/@graphorin/server/classes/MetricRegistry.md) | Optional Prometheus metric registry override. When omitted, the server constructs the canonical registry from [createServerMetricRegistry](/api/@graphorin/server/functions/createServerMetricRegistry.md). | packages/server/src/app.ts:150 |
| <a id="property-now"></a> `now?` | `readonly` | () => `number` | Wall-clock provider for tests. | packages/server/src/app.ts:154 |
| <a id="property-probecipherpeer"></a> `probeCipherPeer?` | `readonly` | () => `Promise`\&lt;`void`\&gt; | Override the cipher peer probe. Tests inject a stub. | packages/server/src/app.ts:156 |
| <a id="property-replay"></a> `replay?` | `readonly` | [`ReplayApi`](/api/@graphorin/server/interfaces/ReplayApi.md) | Optional replay API consumed by the scope-enforced replay endpoints. Phase 14c. | packages/server/src/app.ts:139 |
| <a id="property-runs"></a> `runs?` | `readonly` | [`RunStateTracker`](/api/@graphorin/server/classes/RunStateTracker.md) | Optional pre-built tracker. Tests inject deterministic timing. | packages/server/src/app.ts:113 |
| <a id="property-sessions"></a> `sessions?` | `readonly` | [`SessionApi`](/api/@graphorin/server/interfaces/SessionApi.md) | Optional in-process domain adapters wired into REST routes. | packages/server/src/app.ts:118 |
| <a id="property-skills"></a> `skills?` | `readonly` | [`SkillsApi`](/api/@graphorin/server/interfaces/SkillsApi.md) | - | packages/server/src/app.ts:120 |
| <a id="property-skiphardening"></a> `skipHardening?` | `readonly` | `boolean` | Skip `applyProcessHardening` (tests). | packages/server/src/app.ts:160 |
| <a id="property-skiplisten"></a> `skipListen?` | `readonly` | `boolean` | Skip starting the actual listener (tests). | packages/server/src/app.ts:162 |
| <a id="property-store"></a> `store?` | `readonly` | [`GraphorinSqliteStore`](/api/@graphorin/store-sqlite/interfaces/GraphorinSqliteStore.md) | Pre-built SQLite store. Tests inject an in-memory store. | packages/server/src/app.ts:111 |
| <a id="property-triggers"></a> `triggers?` | `readonly` | [`TriggersDaemonInput`](/api/@graphorin/server/type-aliases/TriggersDaemonInput.md) | Optional triggers daemon - pass an existing one (e.g. built from `createScheduler`) or a triggers configuration the server should wrap with the daemon adapter. | packages/server/src/app.ts:134 |
| <a id="property-validatedconfig"></a> `validatedConfig?` | `readonly` | [`ServerConfigSpec`](/api/@graphorin/server/config/interfaces/ServerConfigSpec.md) | Optional pre-validated config. When supplied, `config` is ignored and the schema validation step is skipped. Useful for tests + the `graphorin migrate` CLI command which bypasses the listener. | packages/server/src/app.ts:109 |
| <a id="property-version"></a> `version?` | `readonly` | `string` | Override the package version reported on `/v1/health`. | packages/server/src/app.ts:158 |
| <a id="property-workflows"></a> `workflows?` | `readonly` | [`WorkflowRegistry`](/api/@graphorin/server/registry/classes/WorkflowRegistry.md) | - | packages/server/src/app.ts:116 |
