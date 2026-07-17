[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / FieldResolution

# Interface: FieldResolution\&lt;T\&gt;

Defined in: [packages/skills/src/types/index.ts:137](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L137)

Resolution outcome of a single field on a `SKILL.md` frontmatter.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-conflicting"></a> `conflicting` | `readonly` | `boolean` | [packages/skills/src/types/index.ts:140](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L140) |
| <a id="property-conflictingsources"></a> `conflictingSources` | `readonly` | readonly `string`[] | [packages/skills/src/types/index.ts:141](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L141) |
| <a id="property-source"></a> `source` | `readonly` | \| `"anthropic-base"` \| `"metadata-graphorin"` \| `"graphorin-prefix"` \| `"fallback"` | [packages/skills/src/types/index.ts:139](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L139) |
| <a id="property-value"></a> `value` | `readonly` | `T` \| `undefined` | [packages/skills/src/types/index.ts:138](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/types/index.ts#L138) |
