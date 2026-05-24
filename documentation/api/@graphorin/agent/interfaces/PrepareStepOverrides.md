[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / PrepareStepOverrides

# Interface: PrepareStepOverrides\&lt;TDeps\&gt;

Defined in: packages/agent/src/types.ts:77

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-maxtokens"></a> `maxTokens?` | `readonly` | `number` | packages/agent/src/types.ts:82 |
| <a id="property-provider"></a> `provider?` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | packages/agent/src/types.ts:78 |
| <a id="property-temperature"></a> `temperature?` | `readonly` | `number` | packages/agent/src/types.ts:81 |
| <a id="property-toolchoice"></a> `toolChoice?` | `readonly` | [`ToolChoice`](/api/@graphorin/core/type-aliases/ToolChoice.md) | packages/agent/src/types.ts:80 |
| <a id="property-tools"></a> `tools?` | `readonly` | readonly [`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;`unknown`, `unknown`, `TDeps`\&gt;[] | packages/agent/src/types.ts:79 |
