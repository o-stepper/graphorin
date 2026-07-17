[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / CommentaryPattern

# Interface: CommentaryPattern

Defined in: [packages/sessions/src/commentary/types.ts:72](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/commentary/types.ts#L72)

Single pattern entry in the [BUILT\_IN\_COMMENTARY\_PATTERNS](/api/@graphorin/sessions/variables/BUILT_IN_COMMENTARY_PATTERNS.md)
catalogue. Keeping the array exported so consumers can inspect the
shape and add their own regex extensions in custom deployments.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string` | [packages/sessions/src/commentary/types.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/commentary/types.ts#L75) |
| <a id="property-reason"></a> `reason` | `readonly` | [`CommentaryReason`](/api/@graphorin/sessions/type-aliases/CommentaryReason.md) | [packages/sessions/src/commentary/types.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/commentary/types.ts#L73) |
| <a id="property-regex"></a> `regex` | `readonly` | `RegExp` | [packages/sessions/src/commentary/types.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/commentary/types.ts#L74) |
