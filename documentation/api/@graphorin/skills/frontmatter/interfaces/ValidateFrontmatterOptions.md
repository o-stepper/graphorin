[**Graphorin API reference v0.9.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [frontmatter](/api/@graphorin/skills/frontmatter/index.md) / ValidateFrontmatterOptions

# Interface: ValidateFrontmatterOptions

Defined in: [packages/skills/src/frontmatter/index.ts:164](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/frontmatter/index.ts#L164)

Options accepted by [validateFrontmatter](/api/@graphorin/skills/frontmatter/functions/validateFrontmatter.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictpolicy"></a> `conflictPolicy?` | `readonly` | [`FrontmatterValidatorPolicy`](/api/@graphorin/skills/type-aliases/FrontmatterValidatorPolicy.md) | Policy for direct collisions (Anthropic-base + `graphorin-*`). | [packages/skills/src/frontmatter/index.ts:166](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/frontmatter/index.ts#L166) |
| <a id="property-runtimeversion"></a> `runtimeVersion?` | `readonly` | `string` | Installed Graphorin runtime version. Used to validate `graphorin-runtime-compat` declarations against the running framework. | [packages/skills/src/frontmatter/index.ts:174](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/frontmatter/index.ts#L174) |
| <a id="property-unknownfieldpolicy"></a> `unknownFieldPolicy?` | `readonly` | [`UnknownFieldPolicy`](/api/@graphorin/skills/type-aliases/UnknownFieldPolicy.md) | Policy for fields not part of the bundled snapshot or `graphorin-*` catalogue. | [packages/skills/src/frontmatter/index.ts:168](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/frontmatter/index.ts#L168) |
