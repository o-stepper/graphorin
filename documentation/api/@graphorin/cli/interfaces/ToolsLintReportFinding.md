[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / ToolsLintReportFinding

# Interface: ToolsLintReportFinding

Defined in: packages/cli/src/commands/tools-lint.ts:142

**`Stable`**

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-hint"></a> `hint?` | `readonly` | `string` | packages/cli/src/commands/tools-lint.ts:148 |
| <a id="property-kind"></a> `kind` | `readonly` | [`LintFindingKind`](/api/@graphorin/eslint-plugin/type-aliases/LintFindingKind.md) | packages/cli/src/commands/tools-lint.ts:144 |
| <a id="property-location"></a> `location` | `readonly` | \{ `file`: `string`; `line`: `number`; \} | packages/cli/src/commands/tools-lint.ts:147 |
| `location.file` | `readonly` | `string` | packages/cli/src/commands/tools-lint.ts:147 |
| `location.line` | `readonly` | `number` | packages/cli/src/commands/tools-lint.ts:147 |
| <a id="property-matchedpattern"></a> `matchedPattern?` | `readonly` | `string` | packages/cli/src/commands/tools-lint.ts:149 |
| <a id="property-message"></a> `message` | `readonly` | `string` | packages/cli/src/commands/tools-lint.ts:146 |
| <a id="property-rule"></a> `rule` | `readonly` | \| `"graphorin/tool-description-required"` \| `"graphorin/tool-examples-recommended"` \| `"graphorin/tool-parameter-naming"` | packages/cli/src/commands/tools-lint.ts:143 |
| <a id="property-severity"></a> `severity` | `readonly` | `"warn"` \| `"info"` \| `"error"` | packages/cli/src/commands/tools-lint.ts:145 |
