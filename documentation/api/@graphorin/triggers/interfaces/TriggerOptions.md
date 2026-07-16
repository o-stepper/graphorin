[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / TriggerOptions

# Interface: TriggerOptions

Defined in: [packages/triggers/src/index.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L65)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-acknowledgelibmode"></a> `acknowledgeLibMode?` | `readonly` | `boolean` | Suppress the one-time per-process library-mode WARN. Library callers acknowledging that triggers fire only as long as the process lives pass `true` here. | [packages/triggers/src/index.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L82) |
| <a id="property-catchuppolicy"></a> `catchupPolicy?` | `readonly` | [`CatchupPolicy`](/api/@graphorin/triggers/type-aliases/CatchupPolicy.md) | - | [packages/triggers/src/index.ts:66](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L66) |
| <a id="property-catchupwindowms"></a> `catchupWindowMs?` | `readonly` | `number` | How far back (from the last successful fire) misses are honored. Catch-up counts REAL missed fires (RP-12), so the window must exceed the trigger period - a 24h window can never catch up a daily cron whose boundary is itself 24h after the last fire. Default 24h. | [packages/triggers/src/index.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L75) |
| <a id="property-expiresat"></a> `expiresAt?` | `readonly` | `string` \| `number` | Instant (ISO-8601 string or epoch ms) after which the trigger auto-pauses instead of firing: the scheduler flips the persistent `disabled` flag (exactly like `setDisabled(id, true)`), emits an `'expired'` event and WARNs once. Non-destructive - the row stays registered for inspection and `POST /v1/triggers/prune { "disabled": true }` cleans it up. Renew by re-registering the declaration with a later `expiresAt` and calling `setDisabled(id, false)`. Default: never expires. | [packages/triggers/src/index.ts:113](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L113) |
| <a id="property-jitterms"></a> `jitterMs?` | `readonly` | `number` | Maximum deterministic jitter, in milliseconds, added to every armed delay of a `cron` / `interval` trigger. The actual offset is derived from a hash of the trigger id - stable across restarts and processes - so a fleet of tasks sharing one wall-clock boundary spreads out while each task keeps a fixed cadence. `idle` / `event` triggers ignore it. The offset shifts only the armed timer, never the persisted schedule, so catch-up math stays on the unjittered grid. Default 0 (no jitter). | [packages/triggers/src/index.ts:102](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L102) |
| <a id="property-maxcatchupruns"></a> `maxCatchupRuns?` | `readonly` | `number` | - | [packages/triggers/src/index.ts:67](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L67) |
| <a id="property-tags"></a> `tags?` | `readonly` | readonly `string`[] | - | [packages/triggers/src/index.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L76) |
| <a id="property-timezone"></a> `timezone?` | `readonly` | `string` | IANA timezone the cron expression's wall clock is evaluated in (W-124). `cron(...)` validates it eagerly - an unknown zone throws at declaration time. DST transitions follow Vixie semantics (see the cron module doc). Applies to `cron` triggers only; the other kinds ignore it (like the catch-up fields they do not use). Default: UTC. | [packages/triggers/src/index.ts:91](https://github.com/o-stepper/graphorin/blob/main/packages/triggers/src/index.ts#L91) |
