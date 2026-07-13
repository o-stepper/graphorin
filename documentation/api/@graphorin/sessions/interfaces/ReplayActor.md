[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ReplayActor

# Interface: ReplayActor

Defined in: [packages/sessions/src/replay/types.ts:17](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/types.ts#L17)

Per-replay actor surfaced on every audit row.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id` | `readonly` | `string` | [packages/sessions/src/replay/types.ts:19](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/types.ts#L19) |
| <a id="property-kind"></a> `kind` | `readonly` | `"agent"` \| `"system"` \| `"token"` \| `"cli"` | [packages/sessions/src/replay/types.ts:18](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/types.ts#L18) |
| <a id="property-label"></a> `label?` | `readonly` | `string` | [packages/sessions/src/replay/types.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/types.ts#L20) |
