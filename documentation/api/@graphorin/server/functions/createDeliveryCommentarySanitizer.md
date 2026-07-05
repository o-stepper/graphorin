[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createDeliveryCommentarySanitizer

# Function: createDeliveryCommentarySanitizer()

```ts
function createDeliveryCommentarySanitizer(config?): DeliveryCommentarySanitizer;
```

Defined in: packages/server/src/commentary/sanitizer.ts:70

Build a stateless delivery-layer sanitizer. Tests can swap the
`sink` for an in-memory recorder; production wires the
`@graphorin/security/audit` `appendAudit` helper.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`DeliveryCommentaryConfig`](/api/@graphorin/server/interfaces/DeliveryCommentaryConfig.md) |

## Returns

[`DeliveryCommentarySanitizer`](/api/@graphorin/server/interfaces/DeliveryCommentarySanitizer.md)

## Stable
