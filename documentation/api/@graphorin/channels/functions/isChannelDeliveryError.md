[**Graphorin API reference v0.13.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / isChannelDeliveryError

# Function: isChannelDeliveryError()

```ts
function isChannelDeliveryError(err): err is ChannelDeliveryError;
```

Defined in: packages/channels/src/spi.ts:235

**`Stable`**

Structural check for [ChannelDeliveryError](/api/@graphorin/channels/classes/ChannelDeliveryError.md) that survives
package-boundary `instanceof` failures (matched by `name`, the
same convention as `EmbedderLockOnFirstError`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `err` | `unknown` |

## Returns

`err is ChannelDeliveryError`
