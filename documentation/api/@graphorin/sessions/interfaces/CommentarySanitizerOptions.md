[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / CommentarySanitizerOptions

# Interface: CommentarySanitizerOptions

Defined in: [packages/sessions/src/commentary/sanitizer.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/commentary/sanitizer.ts#L43)

Options accepted by [createCommentarySanitizer](/api/@graphorin/sessions/functions/createCommentarySanitizer.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-patterns"></a> `patterns?` | `readonly` | readonly [`CommentaryPattern`](/api/@graphorin/sessions/interfaces/CommentaryPattern.md)[] | Override the built-in pattern catalogue. The default exports the full [BUILT\_IN\_COMMENTARY\_PATTERNS](/api/@graphorin/sessions/variables/BUILT_IN_COMMENTARY_PATTERNS.md) list; deployments that want to add custom patterns should append, not replace. | [packages/sessions/src/commentary/sanitizer.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/commentary/sanitizer.ts#L51) |
| <a id="property-policy"></a> `policy?` | `readonly` | [`CommentaryPolicy`](/api/@graphorin/sessions/type-aliases/CommentaryPolicy.md) | Default `'wrap'`. | [packages/sessions/src/commentary/sanitizer.ts:45](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/commentary/sanitizer.ts#L45) |
| <a id="property-wrapclose"></a> `wrapClose?` | `readonly` | `string` | Override the wrap envelope close (test seam / branding). | [packages/sessions/src/commentary/sanitizer.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/commentary/sanitizer.ts#L55) |
| <a id="property-wrapopen"></a> `wrapOpen?` | `readonly` | `string` | Override the wrap envelope (test seam / branding). | [packages/sessions/src/commentary/sanitizer.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/commentary/sanitizer.ts#L53) |
