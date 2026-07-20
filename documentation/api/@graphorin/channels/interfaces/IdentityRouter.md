[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / IdentityRouter

# Interface: IdentityRouter

Defined in: packages/channels/src/router.ts:63

**`Stable`**

Deterministic router over the route table.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-routes"></a> `routes` | `readonly` | readonly [`ChannelRoute`](/api/@graphorin/channels/interfaces/ChannelRoute.md)[] | packages/channels/src/router.ts:66 |

## Methods

### resolve()

```ts
resolve(identity): ResolvedChannelRoute;
```

Defined in: packages/channels/src/router.ts:65

Total function: always resolves (the default route guarantees a match).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `identity` | [`ChannelIdentity`](/api/@graphorin/channels/interfaces/ChannelIdentity.md) |

#### Returns

[`ResolvedChannelRoute`](/api/@graphorin/channels/interfaces/ResolvedChannelRoute.md)
