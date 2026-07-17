[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / createDeliveryCommentarySanitizer

# Function: createDeliveryCommentarySanitizer()

```ts
function createDeliveryCommentarySanitizer(config?): DeliveryCommentarySanitizer;
```

Defined in: [packages/server/src/commentary/sanitizer.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/sanitizer.ts#L73)

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
