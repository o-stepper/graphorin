[**Graphorin API reference v0.5.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [loader](/api/@graphorin/skills/loader/index.md) / LoadSkillsOptions

# Interface: LoadSkillsOptions

Defined in: packages/skills/src/loader/index.ts:85

Aggregate options accepted by [loadSkills](/api/@graphorin/skills/loader/functions/loadSkills.md).

## Extends

- [`LoadSkillOptions`](/api/@graphorin/skills/loader/interfaces/LoadSkillOptions.md)

## Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictpolicy"></a> `conflictPolicy?` | `readonly` | [`FrontmatterValidatorPolicy`](/api/@graphorin/skills/type-aliases/FrontmatterValidatorPolicy.md) | - | [`LoadSkillOptions`](/api/@graphorin/skills/loader/interfaces/LoadSkillOptions.md).[`conflictPolicy`](/api/@graphorin/skills/loader/interfaces/LoadSkillOptions.md#property-conflictpolicy) | packages/skills/src/loader/index.ts:75 |
| <a id="property-mediatypefor"></a> `mediaTypeFor?` | `readonly` | (`path`) => `string` \| `undefined` | Override the bundled MIME-type guesser for resource files. | [`LoadSkillOptions`](/api/@graphorin/skills/loader/interfaces/LoadSkillOptions.md).[`mediaTypeFor`](/api/@graphorin/skills/loader/interfaces/LoadSkillOptions.md#property-mediatypefor) | packages/skills/src/loader/index.ts:81 |
| <a id="property-runtimeversion"></a> `runtimeVersion?` | `readonly` | `string` | - | [`LoadSkillOptions`](/api/@graphorin/skills/loader/interfaces/LoadSkillOptions.md).[`runtimeVersion`](/api/@graphorin/skills/loader/interfaces/LoadSkillOptions.md#property-runtimeversion) | packages/skills/src/loader/index.ts:77 |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | [`LoadSkillOptions`](/api/@graphorin/skills/loader/interfaces/LoadSkillOptions.md).[`signal`](/api/@graphorin/skills/loader/interfaces/LoadSkillOptions.md#property-signal) | packages/skills/src/loader/index.ts:79 |
| <a id="property-supplychainpolicy"></a> `supplyChainPolicy?` | `readonly` | [`SupplyChainPolicy`](/api/@graphorin/security/interfaces/SupplyChainPolicy.md) | - | [`LoadSkillOptions`](/api/@graphorin/skills/loader/interfaces/LoadSkillOptions.md).[`supplyChainPolicy`](/api/@graphorin/skills/loader/interfaces/LoadSkillOptions.md#property-supplychainpolicy) | packages/skills/src/loader/index.ts:78 |
| <a id="property-throwonsourceerror"></a> `throwOnSourceError?` | `readonly` | `boolean` | Fail fast if any source produces a [SkillLoadError](/api/@graphorin/skills/errors/classes/SkillLoadError.md). When `false` (default) the loader logs the source path on the diagnostic and continues with the next source. | - | packages/skills/src/loader/index.ts:91 |
| <a id="property-unknownfieldpolicy"></a> `unknownFieldPolicy?` | `readonly` | [`UnknownFieldPolicy`](/api/@graphorin/skills/type-aliases/UnknownFieldPolicy.md) | - | [`LoadSkillOptions`](/api/@graphorin/skills/loader/interfaces/LoadSkillOptions.md).[`unknownFieldPolicy`](/api/@graphorin/skills/loader/interfaces/LoadSkillOptions.md#property-unknownfieldpolicy) | packages/skills/src/loader/index.ts:76 |
