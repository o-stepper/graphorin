[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AwaitExternalOptions

# Interface: AwaitExternalOptions\&lt;TResume\&gt;

Defined in: [packages/core/src/channels/durable.ts:205](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L205)

Options for [awaitExternal](/api/@graphorin/core/functions/awaitExternal.md).

## Stable

## Type Parameters

| Type Parameter |
| ------ |
| `TResume` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-schema"></a> `schema?` | `readonly` | [`PayloadSchemaLike`](/api/@graphorin/core/interfaces/PayloadSchemaLike.md)\&lt;`TResume`\&gt; | Validates the resolved payload at the replay delivery point. On failure the engine restores the suspension (the thread stays suspended, the invalid value is discarded) and the resolver gets a typed `awakeable-payload-invalid` error. The parsed (possibly transformed) value is what the node receives. | [packages/core/src/channels/durable.ts:213](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/channels/durable.ts#L213) |
