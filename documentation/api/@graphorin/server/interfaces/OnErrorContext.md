[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / OnErrorContext

# Interface: OnErrorContext

Defined in: [packages/server/src/lifecycle/hooks.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/hooks.ts#L53)

Snapshot passed to [LifecycleHooks.onError](/api/@graphorin/server/interfaces/LifecycleHooks.md#property-onerror). Errors raised
outside the request hot path (lifecycle, audit append, etc.) flow
here so operators can fan them into Sentry / Datadog / etc.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-error"></a> `error` | `readonly` | `unknown` | [packages/server/src/lifecycle/hooks.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/hooks.ts#L54) |
| <a id="property-phase"></a> `phase` | `readonly` | `"beforeStart"` \| `"onReady"` \| `"beforeShutdown"` \| `"request"` \| `"background"` | [packages/server/src/lifecycle/hooks.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/lifecycle/hooks.ts#L55) |
