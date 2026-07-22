[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / OnReadyContext

# Interface: OnReadyContext

Defined in: packages/server/src/lifecycle/hooks.ts:30

**`Stable`**

Snapshot passed to [LifecycleHooks.onReady](/api/@graphorin/server/interfaces/LifecycleHooks.md#property-onready).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config` | `readonly` | [`ServerConfigSpec`](/api/@graphorin/server/config/interfaces/ServerConfigSpec.md) | packages/server/src/lifecycle/hooks.ts:31 |
| <a id="property-listeningon"></a> `listeningOn` | `readonly` | \{ `host`: `string`; `port`: `number`; \} | packages/server/src/lifecycle/hooks.ts:32 |
| `listeningOn.host` | `readonly` | `string` | packages/server/src/lifecycle/hooks.ts:32 |
| `listeningOn.port` | `readonly` | `number` | packages/server/src/lifecycle/hooks.ts:32 |
