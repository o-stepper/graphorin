[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ReplayActor

# Interface: ReplayActor

Defined in: packages/sessions/src/replay/types.ts:17

**`Stable`**

Per-replay actor surfaced on every audit row.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/sessions/src/replay/types.ts:19 |
| <a id="property-kind"></a> `kind` | `readonly` | `"agent"` \| `"system"` \| `"token"` \| `"cli"` | packages/sessions/src/replay/types.ts:18 |
| <a id="property-label"></a> `label?` | `readonly` | `string` | packages/sessions/src/replay/types.ts:20 |
