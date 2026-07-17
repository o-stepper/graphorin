[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / DeliveryCommentaryDecision

# Interface: DeliveryCommentaryDecision

Defined in: [packages/server/src/commentary/types.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L80)

Per-emission decision recorded by the sanitizer. Mirrored on the
audit row + the counter increment.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-applied"></a> `applied` | `readonly` | `boolean` | [packages/server/src/commentary/types.ts:84](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L84) |
| <a id="property-boundary"></a> `boundary` | `readonly` | `"event-emission"` | [packages/server/src/commentary/types.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L82) |
| <a id="property-eventtype"></a> `eventType` | `readonly` | `string` | [packages/server/src/commentary/types.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L89) |
| <a id="property-matchedpattern"></a> `matchedPattern` | `readonly` | `string` \| `undefined` | [packages/server/src/commentary/types.ts:86](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L86) |
| <a id="property-policy"></a> `policy` | `readonly` | [`DeliveryCommentaryPolicy`](/api/@graphorin/server/type-aliases/DeliveryCommentaryPolicy.md) | [packages/server/src/commentary/types.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L83) |
| <a id="property-reasons"></a> `reasons` | `readonly` | readonly [`DeliveryCommentaryReason`](/api/@graphorin/server/type-aliases/DeliveryCommentaryReason.md)[] | [packages/server/src/commentary/types.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L85) |
| <a id="property-sha256ofafter"></a> `sha256OfAfter` | `readonly` | `string` | [packages/server/src/commentary/types.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L88) |
| <a id="property-sha256ofbefore"></a> `sha256OfBefore` | `readonly` | `string` | [packages/server/src/commentary/types.ts:87](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L87) |
| <a id="property-transport"></a> `transport` | `readonly` | [`DeliveryCommentaryTransport`](/api/@graphorin/server/type-aliases/DeliveryCommentaryTransport.md) | [packages/server/src/commentary/types.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/commentary/types.ts#L81) |
