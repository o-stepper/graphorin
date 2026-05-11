[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / DeliveryCommentaryPattern

# Interface: DeliveryCommentaryPattern

Defined in: packages/server/src/commentary/types.ts:68

Single pattern entry in the [DEFAULT\_DELIVERY\_COMMENTARY\_PATTERNS](/api/@graphorin/server/variables/DEFAULT_DELIVERY_COMMENTARY_PATTERNS.md)
catalogue. The `regex` is matched against the JSON payload of the
`event` frame (after `JSON.stringify(payload)`); deployments that
want to match against the wire-format string instead can supply
their own catalogue.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string` | packages/server/src/commentary/types.ts:71 |
| <a id="property-reason"></a> `reason` | `readonly` | [`DeliveryCommentaryReason`](/api/@graphorin/server/type-aliases/DeliveryCommentaryReason.md) | packages/server/src/commentary/types.ts:69 |
| <a id="property-regex"></a> `regex` | `readonly` | `RegExp` | packages/server/src/commentary/types.ts:70 |
