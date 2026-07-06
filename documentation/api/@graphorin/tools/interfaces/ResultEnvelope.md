[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / ResultEnvelope

# Interface: ResultEnvelope\&lt;TOutput\&gt;

Defined in: [packages/tools/src/result/envelope.ts:21](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/envelope.ts#L21)

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
| <a id="property-contentparts"></a> `contentParts` | `readonly` | readonly [`MessageContent`](/api/@graphorin/core/type-aliases/MessageContent.md)[] | Multipart wire payload (text + non-text parts). | [packages/tools/src/result/envelope.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/envelope.ts#L27) |
| <a id="property-output"></a> `output` | `readonly` | `TOutput` \| `undefined` | Typed structured payload (the model-facing `output`). | [packages/tools/src/result/envelope.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/envelope.ts#L23) |
| <a id="property-taint"></a> `taint?` | `readonly` | \{ `sensitive?`: `boolean`; `sourceKind?`: `string`; `untrusted?`: `boolean`; \} | C6: per-result taint override carried from the ToolReturn envelope. | [packages/tools/src/result/envelope.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/envelope.ts#L29) |
| `taint.sensitive?` | `readonly` | `boolean` | - | [packages/tools/src/result/envelope.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/envelope.ts#L31) |
| `taint.sourceKind?` | `readonly` | `string` | - | [packages/tools/src/result/envelope.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/envelope.ts#L32) |
| `taint.untrusted?` | `readonly` | `boolean` | - | [packages/tools/src/result/envelope.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/envelope.ts#L30) |
| <a id="property-textbody"></a> `textBody` | `readonly` | `string` | Plain-text rendering of the structured payload (used for cap accounting). | [packages/tools/src/result/envelope.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/result/envelope.ts#L25) |
