[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / CommentarySanitizationDecision

# Interface: CommentarySanitizationDecision

Defined in: [packages/sessions/src/commentary/types.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/commentary/types.ts#L56)

Single sanitization decision recorded by the sanitizer for an
outbound `MessageContent` part.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-applied"></a> `applied` | `readonly` | `boolean` | [packages/sessions/src/commentary/types.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/commentary/types.ts#L59) |
| <a id="property-boundary"></a> `boundary` | `readonly` | [`CommentaryBoundary`](/api/@graphorin/sessions/type-aliases/CommentaryBoundary.md) | [packages/sessions/src/commentary/types.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/commentary/types.ts#L57) |
| <a id="property-policy"></a> `policy` | `readonly` | [`CommentaryPolicy`](/api/@graphorin/sessions/type-aliases/CommentaryPolicy.md) | [packages/sessions/src/commentary/types.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/commentary/types.ts#L58) |
| <a id="property-reasons"></a> `reasons` | `readonly` | readonly [`CommentaryReason`](/api/@graphorin/sessions/type-aliases/CommentaryReason.md)[] | [packages/sessions/src/commentary/types.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/commentary/types.ts#L60) |
| <a id="property-sha256ofafter"></a> `sha256OfAfter` | `readonly` | `string` | [packages/sessions/src/commentary/types.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/commentary/types.ts#L62) |
| <a id="property-sha256ofbefore"></a> `sha256OfBefore` | `readonly` | `string` | [packages/sessions/src/commentary/types.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/commentary/types.ts#L61) |
