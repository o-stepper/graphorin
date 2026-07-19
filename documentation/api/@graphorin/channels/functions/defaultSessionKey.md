[**Graphorin API reference v0.13.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / defaultSessionKey

# Function: defaultSessionKey()

```ts
function defaultSessionKey(identity): string;
```

Defined in: packages/channels/src/router.ts:89

**`Stable`**

Derive the default per-peer session key. Exposed so applications
and the docs agree on the exact shape.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `identity` | [`ChannelIdentity`](/api/@graphorin/channels/interfaces/ChannelIdentity.md) |

## Returns

`string`
