[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ResultEnvelope

# Interface: ResultEnvelope\&lt;TOutput\&gt;

Defined in: packages/tools/src/result/envelope.ts:19

Canonical envelope passed through the executor's downstream
pipeline. The text-shaped portion (`textBody`) is the only field
subject to the result-size cap and the inbound sanitization scan.

## Stable

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOutput` | `unknown` |

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-contentparts"></a> `contentParts` | `readonly` | readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[] | Multipart wire payload (text + non-text parts). | packages/tools/src/result/envelope.ts:25 |
| <a id="property-output"></a> `output` | `readonly` | `TOutput` \| `undefined` | Typed structured payload (the model-facing `output`). | packages/tools/src/result/envelope.ts:21 |
| <a id="property-textbody"></a> `textBody` | `readonly` | `string` | Plain-text rendering of the structured payload (used for cap accounting). | packages/tools/src/result/envelope.ts:23 |
