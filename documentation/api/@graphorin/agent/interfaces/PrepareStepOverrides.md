[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / PrepareStepOverrides

# Interface: PrepareStepOverrides\&lt;TDeps\&gt;

Defined in: packages/agent/src/types.ts:101

**`Stable`**

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TDeps` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-maxtokens"></a> `maxTokens?` | `readonly` | `number` | packages/agent/src/types.ts:106 |
| <a id="property-provider"></a> `provider?` | `readonly` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | packages/agent/src/types.ts:102 |
| <a id="property-temperature"></a> `temperature?` | `readonly` | `number` | packages/agent/src/types.ts:105 |
| <a id="property-toolchoice"></a> `toolChoice?` | `readonly` | [`ToolChoice`](/api/@graphorin/core/type-aliases/ToolChoice.md) | packages/agent/src/types.ts:104 |
| <a id="property-tools"></a> `tools?` | `readonly` | readonly [`AnyTool`](/api/@graphorin/core/type-aliases/AnyTool.md)\&lt;`TDeps`\&gt;[] | packages/agent/src/types.ts:103 |
