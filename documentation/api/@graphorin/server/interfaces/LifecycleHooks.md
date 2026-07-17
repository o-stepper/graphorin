[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / LifecycleHooks

# Interface: LifecycleHooks

Defined in: [packages/server/src/lifecycle/hooks.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/hooks.ts#L61)

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-beforeshutdown"></a> `beforeShutdown?` | `readonly` | (`ctx`) => `void` \| `Promise`\&lt;`void`\&gt; | [packages/server/src/lifecycle/hooks.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/hooks.ts#L64) |
| <a id="property-beforestart"></a> `beforeStart?` | `readonly` | (`ctx`) => `void` \| `Promise`\&lt;`void`\&gt; | [packages/server/src/lifecycle/hooks.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/hooks.ts#L62) |
| <a id="property-onerror"></a> `onError?` | `readonly` | (`ctx`) => `void` \| `Promise`\&lt;`void`\&gt; | [packages/server/src/lifecycle/hooks.ts:65](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/hooks.ts#L65) |
| <a id="property-onready"></a> `onReady?` | `readonly` | (`ctx`) => `void` \| `Promise`\&lt;`void`\&gt; | [packages/server/src/lifecycle/hooks.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/hooks.ts#L63) |
