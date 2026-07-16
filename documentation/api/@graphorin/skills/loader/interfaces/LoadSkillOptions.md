[**Graphorin API reference v0.10.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [loader](/api/@graphorin/skills/loader/index.md) / LoadSkillOptions

# Interface: LoadSkillOptions

Defined in: [packages/skills/src/loader/index.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/loader/index.ts#L74)

Options forwarded to [loadSkillFromSource](/api/@graphorin/skills/loader/functions/loadSkillFromSource.md).

## Extended by

- [`LoadSkillsOptions`](/api/@graphorin/skills/loader/interfaces/LoadSkillsOptions.md)

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-conflictpolicy"></a> `conflictPolicy?` | `readonly` | [`FrontmatterValidatorPolicy`](/api/@graphorin/skills/type-aliases/FrontmatterValidatorPolicy.md) | - | [packages/skills/src/loader/index.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/loader/index.ts#L75) |
| <a id="property-mediatypefor"></a> `mediaTypeFor?` | `readonly` | (`path`) => `string` \| `undefined` | Override the bundled MIME-type guesser for resource files. | [packages/skills/src/loader/index.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/loader/index.ts#L81) |
| <a id="property-runtimeversion"></a> `runtimeVersion?` | `readonly` | `string` | - | [packages/skills/src/loader/index.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/loader/index.ts#L77) |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | - | [packages/skills/src/loader/index.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/loader/index.ts#L79) |
| <a id="property-supplychainpolicy"></a> `supplyChainPolicy?` | `readonly` | [`SupplyChainPolicy`](/api/@graphorin/security/interfaces/SupplyChainPolicy.md) | - | [packages/skills/src/loader/index.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/loader/index.ts#L78) |
| <a id="property-unknownfieldpolicy"></a> `unknownFieldPolicy?` | `readonly` | [`UnknownFieldPolicy`](/api/@graphorin/skills/type-aliases/UnknownFieldPolicy.md) | - | [packages/skills/src/loader/index.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/loader/index.ts#L76) |
