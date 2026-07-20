[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / [](/api/@graphorin/eslint-plugin/README.md) / LintFinding

# Interface: LintFinding

Defined in: src/tool-discovery.ts:112

**`Stable`**

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-file"></a> `file` | `readonly` | `string` | - | src/tool-discovery.ts:121 |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | - | src/tool-discovery.ts:123 |
| <a id="property-kind"></a> `kind` | `readonly` | [`LintFindingKind`](/api/@graphorin/eslint-plugin/type-aliases/LintFindingKind.md) | - | src/tool-discovery.ts:117 |
| <a id="property-line"></a> `line` | `readonly` | `number` | - | src/tool-discovery.ts:122 |
| <a id="property-matchedpattern"></a> `matchedPattern?` | `readonly` | `string` | Optional matched-pattern context. Populated by the `examples-pii-detected` finding so reports can highlight which example payload triggered the rule. | src/tool-discovery.ts:129 |
| <a id="property-message"></a> `message` | `readonly` | `string` | - | src/tool-discovery.ts:119 |
| <a id="property-rule"></a> `rule` | `readonly` | \| `"graphorin/tool-description-required"` \| `"graphorin/tool-examples-recommended"` \| `"graphorin/tool-parameter-naming"` | - | src/tool-discovery.ts:113 |
| <a id="property-severity"></a> `severity` | `readonly` | `"error"` \| `"warn"` \| `"info"` | - | src/tool-discovery.ts:118 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | src/tool-discovery.ts:120 |
