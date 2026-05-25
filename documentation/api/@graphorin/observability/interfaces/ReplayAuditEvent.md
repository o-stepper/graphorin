[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / ReplayAuditEvent

# Interface: ReplayAuditEvent

Defined in: packages/observability/src/replay/types.ts:40

Sanitized event passed to the audit bridge.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | `"trace.replay.accessed"` | packages/observability/src/replay/types.ts:41 |
| <a id="property-actor"></a> `actor` | `readonly` | \{ `id`: `string`; `kind`: `"agent"` \| `"system"` \| `"token"` \| `"cli"`; \} | packages/observability/src/replay/types.ts:42 |
| `actor.id` | `readonly` | `string` | packages/observability/src/replay/types.ts:42 |
| `actor.kind` | `readonly` | `"agent"` \| `"system"` \| `"token"` \| `"cli"` | packages/observability/src/replay/types.ts:42 |
| <a id="property-decision"></a> `decision` | `readonly` | `"success"` \| `"denied"` | packages/observability/src/replay/types.ts:44 |
| <a id="property-metadata"></a> `metadata` | `readonly` | \{ `durationMs`: `number`; `eventCount`: `number`; `fromSpanId?`: `string`; `minSensitivity`: [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md); `mode`: [`ReplayMode`](/api/@graphorin/observability/type-aliases/ReplayMode.md); \} | packages/observability/src/replay/types.ts:45 |
| `metadata.durationMs` | `readonly` | `number` | packages/observability/src/replay/types.ts:50 |
| `metadata.eventCount` | `readonly` | `number` | packages/observability/src/replay/types.ts:49 |
| `metadata.fromSpanId?` | `readonly` | `string` | packages/observability/src/replay/types.ts:48 |
| `metadata.minSensitivity` | `readonly` | [`Sensitivity`](/api/@graphorin/core/type-aliases/Sensitivity.md) | packages/observability/src/replay/types.ts:47 |
| `metadata.mode` | `readonly` | [`ReplayMode`](/api/@graphorin/observability/type-aliases/ReplayMode.md) | packages/observability/src/replay/types.ts:46 |
| <a id="property-target"></a> `target` | `readonly` | `string` | packages/observability/src/replay/types.ts:43 |
