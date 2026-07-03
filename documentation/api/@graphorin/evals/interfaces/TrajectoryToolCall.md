[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / TrajectoryToolCall

# Interface: TrajectoryToolCall

Defined in: evals/src/scorers/trajectory/types.ts:20

One executed tool call as observed on the `AgentEvent` stream.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `unknown` | The arguments the model emitted (the resolved `tool.call.end.finalArgs`). | evals/src/scorers/trajectory/types.ts:24 |
| <a id="property-error"></a> `error?` | `readonly` | \{ `kind?`: `string`; `message?`: `string`; \} | The surfaced error, present when `status === 'error'`. | evals/src/scorers/trajectory/types.ts:30 |
| `error.kind?` | `readonly` | `string` | - | evals/src/scorers/trajectory/types.ts:30 |
| `error.message?` | `readonly` | `string` | - | evals/src/scorers/trajectory/types.ts:30 |
| <a id="property-result"></a> `result?` | `readonly` | `unknown` | The tool output, present when `status === 'ok'`. | evals/src/scorers/trajectory/types.ts:28 |
| <a id="property-status"></a> `status` | `readonly` | `"ok"` \| `"error"` | `'ok'` when the call returned; `'error'` when the executor surfaced a `ToolError`. | evals/src/scorers/trajectory/types.ts:26 |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | evals/src/scorers/trajectory/types.ts:21 |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | evals/src/scorers/trajectory/types.ts:22 |
