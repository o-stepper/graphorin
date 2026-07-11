[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / [](/api/@graphorin/eslint-plugin/README.md) / LintFinding

# Interface: LintFinding

Defined in: [packages/eslint-plugin/src/tool-discovery.ts:112](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L112)

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-file"></a> `file` | `readonly` | `string` | - | [packages/eslint-plugin/src/tool-discovery.ts:121](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L121) |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | - | [packages/eslint-plugin/src/tool-discovery.ts:123](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L123) |
| <a id="property-kind"></a> `kind` | `readonly` | [`LintFindingKind`](/api/@graphorin/eslint-plugin/type-aliases/LintFindingKind.md) | - | [packages/eslint-plugin/src/tool-discovery.ts:117](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L117) |
| <a id="property-line"></a> `line` | `readonly` | `number` | - | [packages/eslint-plugin/src/tool-discovery.ts:122](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L122) |
| <a id="property-matchedpattern"></a> `matchedPattern?` | `readonly` | `string` | Optional matched-pattern context. Populated by the `examples-pii-detected` finding so reports can highlight which example payload triggered the rule. | [packages/eslint-plugin/src/tool-discovery.ts:129](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L129) |
| <a id="property-message"></a> `message` | `readonly` | `string` | - | [packages/eslint-plugin/src/tool-discovery.ts:119](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L119) |
| <a id="property-rule"></a> `rule` | `readonly` | \| `"graphorin/tool-description-required"` \| `"graphorin/tool-examples-recommended"` \| `"graphorin/tool-parameter-naming"` | - | [packages/eslint-plugin/src/tool-discovery.ts:113](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L113) |
| <a id="property-severity"></a> `severity` | `readonly` | `"error"` \| `"warn"` \| `"info"` | - | [packages/eslint-plugin/src/tool-discovery.ts:118](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L118) |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | [packages/eslint-plugin/src/tool-discovery.ts:120](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/tool-discovery.ts#L120) |
