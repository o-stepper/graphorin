[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / createIdentityRouter

# Function: createIdentityRouter()

```ts
function createIdentityRouter(options): IdentityRouter;
```

Defined in: packages/channels/src/router.ts:113

**`Stable`**

Build a deterministic identity router. Throws
[ChannelRouteConfigError](/api/@graphorin/channels/classes/ChannelRouteConfigError.md) when the table is empty, contains a
row with an empty `agentId`, or lacks a catch-all default route.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`IdentityRouterOptions`](/api/@graphorin/channels/interfaces/IdentityRouterOptions.md) |

## Returns

[`IdentityRouter`](/api/@graphorin/channels/interfaces/IdentityRouter.md)
