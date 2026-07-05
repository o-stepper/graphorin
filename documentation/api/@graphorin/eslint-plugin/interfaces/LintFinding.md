[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / LintFinding

# Interface: LintFinding

Defined in: tool-discovery.ts:86

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-file"></a> `file` | `readonly` | `string` | - | tool-discovery.ts:95 |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | - | tool-discovery.ts:97 |
| <a id="property-kind"></a> `kind` | `readonly` | [`LintFindingKind`](/api/@graphorin/eslint-plugin/type-aliases/LintFindingKind.md) | - | tool-discovery.ts:91 |
| <a id="property-line"></a> `line` | `readonly` | `number` | - | tool-discovery.ts:96 |
| <a id="property-matchedpattern"></a> `matchedPattern?` | `readonly` | `string` | Optional matched-pattern context. Populated by the `examples-pii-detected` finding so reports can highlight which example payload triggered the rule. | tool-discovery.ts:103 |
| <a id="property-message"></a> `message` | `readonly` | `string` | - | tool-discovery.ts:93 |
| <a id="property-rule"></a> `rule` | `readonly` | \| `"graphorin/tool-description-required"` \| `"graphorin/tool-examples-recommended"` \| `"graphorin/tool-parameter-naming"` | - | tool-discovery.ts:87 |
| <a id="property-severity"></a> `severity` | `readonly` | `"error"` \| `"warn"` \| `"info"` | - | tool-discovery.ts:92 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | tool-discovery.ts:94 |
