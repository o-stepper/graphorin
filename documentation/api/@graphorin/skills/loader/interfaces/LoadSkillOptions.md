[**Graphorin API reference v0.13.9**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [loader](/api/@graphorin/skills/loader/index.md) / LoadSkillOptions

# Interface: LoadSkillOptions

Defined in: packages/skills/src/loader/index.ts:74

Options forwarded to [loadSkillFromSource](/api/@graphorin/skills/loader/functions/loadSkillFromSource.md).

## Extended by

- [`LoadSkillsOptions`](/api/@graphorin/skills/loader/interfaces/LoadSkillsOptions.md)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictpolicy"></a> `conflictPolicy?` | `readonly` | [`FrontmatterValidatorPolicy`](/api/@graphorin/skills/type-aliases/FrontmatterValidatorPolicy.md) | - | packages/skills/src/loader/index.ts:75 |
| <a id="property-mediatypefor"></a> `mediaTypeFor?` | `readonly` | (`path`) => `string` \| `undefined` | Override the bundled MIME-type guesser for resource files. | packages/skills/src/loader/index.ts:81 |
| <a id="property-runtimeversion"></a> `runtimeVersion?` | `readonly` | `string` | - | packages/skills/src/loader/index.ts:77 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | packages/skills/src/loader/index.ts:79 |
| <a id="property-supplychainpolicy"></a> `supplyChainPolicy?` | `readonly` | [`SupplyChainPolicy`](/api/@graphorin/security/interfaces/SupplyChainPolicy.md) | - | packages/skills/src/loader/index.ts:78 |
| <a id="property-unknownfieldpolicy"></a> `unknownFieldPolicy?` | `readonly` | [`UnknownFieldPolicy`](/api/@graphorin/skills/type-aliases/UnknownFieldPolicy.md) | - | packages/skills/src/loader/index.ts:76 |
