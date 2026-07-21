[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / DeliveryCommentaryDecision

# Interface: DeliveryCommentaryDecision

Defined in: packages/server/src/commentary/types.ts:80

**`Stable`**

Per-emission decision recorded by the sanitizer. Mirrored on the
audit row + the counter increment.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-applied"></a> `applied` | `readonly` | `boolean` | packages/server/src/commentary/types.ts:84 |
| <a id="property-boundary"></a> `boundary` | `readonly` | `"event-emission"` | packages/server/src/commentary/types.ts:82 |
| <a id="property-eventtype"></a> `eventType` | `readonly` | `string` | packages/server/src/commentary/types.ts:89 |
| <a id="property-matchedpattern"></a> `matchedPattern` | `readonly` | `string` \| `undefined` | packages/server/src/commentary/types.ts:86 |
| <a id="property-policy"></a> `policy` | `readonly` | [`DeliveryCommentaryPolicy`](/api/@graphorin/server/type-aliases/DeliveryCommentaryPolicy.md) | packages/server/src/commentary/types.ts:83 |
| <a id="property-reasons"></a> `reasons` | `readonly` | readonly [`DeliveryCommentaryReason`](/api/@graphorin/server/type-aliases/DeliveryCommentaryReason.md)[] | packages/server/src/commentary/types.ts:85 |
| <a id="property-sha256ofafter"></a> `sha256OfAfter` | `readonly` | `string` | packages/server/src/commentary/types.ts:88 |
| <a id="property-sha256ofbefore"></a> `sha256OfBefore` | `readonly` | `string` | packages/server/src/commentary/types.ts:87 |
| <a id="property-transport"></a> `transport` | `readonly` | [`DeliveryCommentaryTransport`](/api/@graphorin/server/type-aliases/DeliveryCommentaryTransport.md) | packages/server/src/commentary/types.ts:81 |
