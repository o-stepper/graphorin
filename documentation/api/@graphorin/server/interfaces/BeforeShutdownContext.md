[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / BeforeShutdownContext

# Interface: BeforeShutdownContext

Defined in: packages/server/src/lifecycle/hooks.ts:40

**`Stable`**

Snapshot passed to [LifecycleHooks.beforeShutdown](/api/@graphorin/server/interfaces/LifecycleHooks.md#property-beforeshutdown).

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config` | `readonly` | [`ServerConfigSpec`](/api/@graphorin/server/config/interfaces/ServerConfigSpec.md) | packages/server/src/lifecycle/hooks.ts:41 |
| <a id="property-draintimeoutms"></a> `drainTimeoutMs` | `readonly` | `number` | packages/server/src/lifecycle/hooks.ts:43 |
| <a id="property-inflight"></a> `inflight` | `readonly` | `number` | packages/server/src/lifecycle/hooks.ts:42 |
