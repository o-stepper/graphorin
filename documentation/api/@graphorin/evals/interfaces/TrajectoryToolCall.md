[**Graphorin API reference v0.7.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/evals](/api/@graphorin/evals/index.md) / [](/api/@graphorin/evals/README.md) / TrajectoryToolCall

# Interface: TrajectoryToolCall

Defined in: [packages/evals/src/scorers/trajectory/types.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/types.ts#L20)

One executed tool call as observed on the `AgentEvent` stream.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-args"></a> `args` | `readonly` | `unknown` | The arguments the model emitted (the resolved `tool.call.end.finalArgs`). | [packages/evals/src/scorers/trajectory/types.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/types.ts#L24) |
| <a id="property-error"></a> `error?` | `readonly` | \{ `kind?`: `string`; `message?`: `string`; \} | The surfaced error, present when `status === 'error'`. | [packages/evals/src/scorers/trajectory/types.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/types.ts#L30) |
| `error.kind?` | `readonly` | `string` | - | [packages/evals/src/scorers/trajectory/types.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/types.ts#L30) |
| `error.message?` | `readonly` | `string` | - | [packages/evals/src/scorers/trajectory/types.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/types.ts#L30) |
| <a id="property-result"></a> `result?` | `readonly` | `unknown` | The tool output, present when `status === 'ok'`. | [packages/evals/src/scorers/trajectory/types.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/types.ts#L28) |
| <a id="property-status"></a> `status` | `readonly` | `"ok"` \| `"error"` | `'ok'` when the call returned; `'error'` when the executor surfaced a `ToolError`. | [packages/evals/src/scorers/trajectory/types.ts:26](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/types.ts#L26) |
| <a id="property-toolcallid"></a> `toolCallId` | `readonly` | `string` | - | [packages/evals/src/scorers/trajectory/types.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/types.ts#L21) |
| <a id="property-toolname"></a> `toolName` | `readonly` | `string` | - | [packages/evals/src/scorers/trajectory/types.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/evals/src/scorers/trajectory/types.ts#L22) |
