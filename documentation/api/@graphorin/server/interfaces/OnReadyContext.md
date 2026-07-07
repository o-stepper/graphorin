[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / OnReadyContext

# Interface: OnReadyContext

Defined in: [packages/server/src/lifecycle/hooks.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/hooks.ts#L30)

Snapshot passed to [LifecycleHooks.onReady](/api/@graphorin/server/interfaces/LifecycleHooks.md#property-onready).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config` | `readonly` | [`ServerConfigSpec`](/api/@graphorin/server/config/interfaces/ServerConfigSpec.md) | [packages/server/src/lifecycle/hooks.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/hooks.ts#L31) |
| <a id="property-listeningon"></a> `listeningOn` | `readonly` | \{ `host`: `string`; `port`: `number`; \} | [packages/server/src/lifecycle/hooks.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/hooks.ts#L32) |
| `listeningOn.host` | `readonly` | `string` | [packages/server/src/lifecycle/hooks.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/hooks.ts#L32) |
| `listeningOn.port` | `readonly` | `number` | [packages/server/src/lifecycle/hooks.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/hooks.ts#L32) |
