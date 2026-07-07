[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / ToolsLintReport

# Interface: ToolsLintReport

Defined in: [packages/cli/src/commands/tools-lint.ts:117](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/tools-lint.ts#L117)

Documented JSON shape emitted on `--format json`. The shape is
stable + forward-compatible with the `@eslint/mcp` industry
direction (per-finding `rule` / `severity` / `message` / `location`
mirror the ESLint LSP convention).

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-summary"></a> `summary` | `readonly` | \{ `failed`: `number`; `passed`: `number`; `threshold`: `number`; `totalFindings`: `number`; `totalTools`: `number`; \} | [packages/cli/src/commands/tools-lint.ts:118](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/tools-lint.ts#L118) |
| `summary.failed` | `readonly` | `number` | [packages/cli/src/commands/tools-lint.ts:123](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/tools-lint.ts#L123) |
| `summary.passed` | `readonly` | `number` | [packages/cli/src/commands/tools-lint.ts:122](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/tools-lint.ts#L122) |
| `summary.threshold` | `readonly` | `number` | [packages/cli/src/commands/tools-lint.ts:121](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/tools-lint.ts#L121) |
| `summary.totalFindings` | `readonly` | `number` | [packages/cli/src/commands/tools-lint.ts:120](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/tools-lint.ts#L120) |
| `summary.totalTools` | `readonly` | `number` | [packages/cli/src/commands/tools-lint.ts:119](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/tools-lint.ts#L119) |
| <a id="property-tools"></a> `tools` | `readonly` | readonly `ToolsLintReportTool`[] | [packages/cli/src/commands/tools-lint.ts:125](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/tools-lint.ts#L125) |
