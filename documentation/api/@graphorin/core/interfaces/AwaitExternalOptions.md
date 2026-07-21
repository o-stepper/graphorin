[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / AwaitExternalOptions

# Interface: AwaitExternalOptions\&lt;TResume\&gt;

Defined in: packages/core/src/channels/durable.ts:205

**`Stable`**

Options for [awaitExternal](/api/@graphorin/core/functions/awaitExternal.md).

## Type Parameters

| Type Parameter |
| ------ |
| `TResume` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-schema"></a> `schema?` | `readonly` | [`PayloadSchemaLike`](/api/@graphorin/core/interfaces/PayloadSchemaLike.md)\&lt;`TResume`\&gt; | Validates the resolved payload at the replay delivery point. On failure the engine restores the suspension (the thread stays suspended, the invalid value is discarded) and the resolver gets a typed `awakeable-payload-invalid` error. The parsed (possibly transformed) value is what the node receives. | packages/core/src/channels/durable.ts:213 |
