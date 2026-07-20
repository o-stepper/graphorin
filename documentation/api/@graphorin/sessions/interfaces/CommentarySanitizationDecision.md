[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / CommentarySanitizationDecision

# Interface: CommentarySanitizationDecision

Defined in: packages/sessions/src/commentary/types.ts:56

**`Stable`**

Single sanitization decision recorded by the sanitizer for an
outbound `MessageContent` part.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-applied"></a> `applied` | `readonly` | `boolean` | packages/sessions/src/commentary/types.ts:59 |
| <a id="property-boundary"></a> `boundary` | `readonly` | [`CommentaryBoundary`](/api/@graphorin/sessions/type-aliases/CommentaryBoundary.md) | packages/sessions/src/commentary/types.ts:57 |
| <a id="property-policy"></a> `policy` | `readonly` | [`CommentaryPolicy`](/api/@graphorin/sessions/type-aliases/CommentaryPolicy.md) | packages/sessions/src/commentary/types.ts:58 |
| <a id="property-reasons"></a> `reasons` | `readonly` | readonly [`CommentaryReason`](/api/@graphorin/sessions/type-aliases/CommentaryReason.md)[] | packages/sessions/src/commentary/types.ts:60 |
| <a id="property-sha256ofafter"></a> `sha256OfAfter` | `readonly` | `string` | packages/sessions/src/commentary/types.ts:62 |
| <a id="property-sha256ofbefore"></a> `sha256OfBefore` | `readonly` | `string` | packages/sessions/src/commentary/types.ts:61 |
