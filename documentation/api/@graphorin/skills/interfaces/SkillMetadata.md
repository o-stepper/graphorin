[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / SkillMetadata

# Interface: SkillMetadata

Defined in: packages/skills/src/types/index.ts:165

Validated skill metadata. Always available on the registry without
loading the body — this is the always-present **Tier 1** payload
that the system prompt advertises.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-allowedtools"></a> `allowedTools?` | `readonly` | readonly `string`[] | - | packages/skills/src/types/index.ts:171 |
| <a id="property-compatibility"></a> `compatibility?` | `readonly` | `string` | - | packages/skills/src/types/index.ts:169 |
| <a id="property-description"></a> `description` | `readonly` | `string` | - | packages/skills/src/types/index.ts:167 |
| <a id="property-disablemodelinvocation"></a> `disableModelInvocation` | `readonly` | `boolean` | - | packages/skills/src/types/index.ts:172 |
| <a id="property-graphorinanthropicspec"></a> `graphorinAnthropicSpec?` | `readonly` | `string` | - | packages/skills/src/types/index.ts:180 |
| <a id="property-graphorinhandoffinputfilter"></a> `graphorinHandoffInputFilter?` | `readonly` | [`HandoffInputFilterDeclaration`](/api/@graphorin/skills/type-aliases/HandoffInputFilterDeclaration.md) | - | packages/skills/src/types/index.ts:178 |
| <a id="property-graphorinruntimecompat"></a> `graphorinRuntimeCompat?` | `readonly` | `string` | - | packages/skills/src/types/index.ts:174 |
| <a id="property-graphorinsandbox"></a> `graphorinSandbox?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | packages/skills/src/types/index.ts:177 |
| <a id="property-graphorinsensitivity"></a> `graphorinSensitivity?` | `readonly` | `string` | - | packages/skills/src/types/index.ts:175 |
| <a id="property-graphorinsensitivitydefaults"></a> `graphorinSensitivityDefaults?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `string`\&gt;\> | - | packages/skills/src/types/index.ts:176 |
| <a id="property-graphorinsignaturepresent"></a> `graphorinSignaturePresent` | `readonly` | `boolean` | - | packages/skills/src/types/index.ts:179 |
| <a id="property-graphorintrustlevel"></a> `graphorinTrustLevel` | `readonly` | [`SkillsTrustLevel`](/api/@graphorin/skills/type-aliases/SkillsTrustLevel.md) | - | packages/skills/src/types/index.ts:173 |
| <a id="property-graphorinversion"></a> `graphorinVersion?` | `readonly` | `string` | Author-declared graphorin runtime / extension version. | packages/skills/src/types/index.ts:182 |
| <a id="property-license"></a> `license?` | `readonly` | `string` | - | packages/skills/src/types/index.ts:168 |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | - | packages/skills/src/types/index.ts:170 |
| <a id="property-name"></a> `name` | `readonly` | `string` | - | packages/skills/src/types/index.ts:166 |
| <a id="property-raw"></a> `raw` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | Raw frontmatter (read-only) for power users — every loader user can re-derive bespoke fields. | packages/skills/src/types/index.ts:184 |
