[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/channels](/api/@graphorin/channels/index.md) / [](/api/@graphorin/channels/README.md) / sanitizeChannelInbound

# Function: sanitizeChannelInbound()

```ts
function sanitizeChannelInbound(body, options): SanitizationOutcome;
```

Defined in: [packages/channels/src/inbound.ts:48](https://github.com/o-stepper/graphorin/blob/main/packages/channels/src/inbound.ts#L48)

Sanitize one inbound channel message body. Thin wrapper over
`applyInboundSanitization` with `trustClass: 'channel-inbound'`;
exists so every gateway (and adapter test) applies the identical
boundary with one call.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `string` |
| `options` | [`SanitizeChannelInboundOptions`](/api/@graphorin/channels/interfaces/SanitizeChannelInboundOptions.md) |

## Returns

[`SanitizationOutcome`](/api/@graphorin/channels/interfaces/SanitizationOutcome.md)

## Stable
