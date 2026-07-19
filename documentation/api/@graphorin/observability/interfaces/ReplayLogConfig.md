[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / ReplayLogConfig

# Interface: ReplayLogConfig

Defined in: packages/observability/src/replay/config.ts:14

**`Stable`**

Shape consumed by `observability.replayLog.*`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-autoprune"></a> `autoPrune?` | `readonly` | \{ `enabled`: `boolean`; `schedule?`: `string`; \} | Auto-prune hint. `enabled` + `schedule` describe a daily prune of files older than `retentionDays`, but **no built-in scheduler consumes this yet** - it is a declarative intent. Until a host wires it to a trigger, callers must run `pruneTraces(...)` themselves; the default is therefore `enabled: false` so the option is not an inert default-on. **Default** `{ enabled: false, schedule: '0 4 * * *' }` | packages/observability/src/replay/config.ts:35 |
| `autoPrune.enabled` | `readonly` | `boolean` | - | packages/observability/src/replay/config.ts:36 |
| `autoPrune.schedule?` | `readonly` | `string` | - | packages/observability/src/replay/config.ts:37 |
| <a id="property-encryption"></a> `encryption?` | `readonly` | `"off"` \| `"aes256gcm"` | Encryption-at-rest toggle. `'off'` (default) writes plain JSONL; the opt-in `'aes256gcm'` mode hooks into the encryption-at-rest passphrase chain (Phase 16 deliverable). **Default** `'off'` | packages/observability/src/replay/config.ts:46 |
| <a id="property-path"></a> `path` | `readonly` | `string` | Root directory for the JSONL trace files. Required when the replay log is enabled. | packages/observability/src/replay/config.ts:19 |
| <a id="property-retentiondays"></a> `retentionDays?` | `readonly` | `number` | Retention window in days. `0` keeps every file forever. **Default** `30` | packages/observability/src/replay/config.ts:25 |
