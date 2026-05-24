[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ToolReturn

# Interface: ToolReturn\&lt;TOutput\&gt;

Defined in: packages/core/src/contracts/tool.ts:203

Optional return envelope: pairs a typed `output` (passed to the model)
with extra `contentParts` that are appended verbatim to the
conversation (images, files, audio, …).

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-contentparts"></a> `contentParts?` | `readonly` | readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[] | packages/core/src/contracts/tool.ts:205 |
| <a id="property-output"></a> `output` | `readonly` | `TOutput` | packages/core/src/contracts/tool.ts:204 |
