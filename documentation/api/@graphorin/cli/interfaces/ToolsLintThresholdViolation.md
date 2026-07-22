[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / ToolsLintThresholdViolation

# Interface: ToolsLintThresholdViolation

Defined in: packages/cli/src/commands/tools-lint.ts:75

**`Stable`**

Counter event emitted per below-threshold tool per invocation. The
CLI exposes a configurable sink so observability pipelines (Phase
04) can wire the counter into Prometheus / OTLP without touching
the CLI runtime. Default: no-op.

Mirrors the documented counter contract
`tool.lint.threshold.violations.total{toolName,score,threshold}`.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-score"></a> `score` | `readonly` | `number` | packages/cli/src/commands/tools-lint.ts:77 |
| <a id="property-threshold"></a> `threshold` | `readonly` | `number` | packages/cli/src/commands/tools-lint.ts:78 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | packages/cli/src/commands/tools-lint.ts:76 |
