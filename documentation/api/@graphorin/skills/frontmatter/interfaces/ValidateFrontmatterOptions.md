[**Graphorin API reference v0.13.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [frontmatter](/api/@graphorin/skills/frontmatter/index.md) / ValidateFrontmatterOptions

# Interface: ValidateFrontmatterOptions

Defined in: packages/skills/src/frontmatter/index.ts:164

**`Stable`**

Options accepted by [validateFrontmatter](/api/@graphorin/skills/frontmatter/functions/validateFrontmatter.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictpolicy"></a> `conflictPolicy?` | `readonly` | [`FrontmatterValidatorPolicy`](/api/@graphorin/skills/type-aliases/FrontmatterValidatorPolicy.md) | Policy for direct collisions (Anthropic-base + `graphorin-*`). | packages/skills/src/frontmatter/index.ts:166 |
| <a id="property-runtimeversion"></a> `runtimeVersion?` | `readonly` | `string` | Installed Graphorin runtime version. Used to validate `graphorin-runtime-compat` declarations against the running framework. | packages/skills/src/frontmatter/index.ts:174 |
| <a id="property-unknownfieldpolicy"></a> `unknownFieldPolicy?` | `readonly` | [`UnknownFieldPolicy`](/api/@graphorin/skills/type-aliases/UnknownFieldPolicy.md) | Policy for fields not part of the bundled snapshot or `graphorin-*` catalogue. | packages/skills/src/frontmatter/index.ts:168 |
