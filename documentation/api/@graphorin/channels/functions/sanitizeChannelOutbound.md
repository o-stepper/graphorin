[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / sanitizeChannelOutbound

# Function: sanitizeChannelOutbound()

```ts
function sanitizeChannelOutbound(text, policy?): OutboundSanitizationResult;
```

Defined in: [packages/channels/src/outbound.ts:49](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/outbound.ts#L49)

Sanitize one outbound channel text. `'strip'` (default) removes
matched fragments AND drops segments an upstream boundary already
wrapped; `'wrap'` behaves like the server/session boundaries
(idempotent envelope); `'pass-through'` disables the pass.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `text` | `string` | `undefined` |
| `policy` | [`OutboundCommentaryPolicy`](/api/@graphorin/channels/type-aliases/OutboundCommentaryPolicy.md) | `'strip'` |

## Returns

[`OutboundSanitizationResult`](/api/@graphorin/channels/interfaces/OutboundSanitizationResult.md)

## Stable
