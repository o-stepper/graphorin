[**Graphorin API reference v0.6.1**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/vercel](/api/@graphorin/provider/adapters/vercel/index.md) / VercelRuntimeOverrides

# Interface: VercelRuntimeOverrides

Defined in: packages/provider/src/adapters/vercel.ts:94

Subset of the AI SDK surface used by the adapter.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-generatetext"></a> `generateText` | `readonly` | (`args`) => `Promise`\<\{ `finishReason?`: `string`; `providerMetadata?`: `Readonly`\<`Record`\<`string`, `unknown`\>\>; `text?`: `string`; `toolCalls?`: readonly \{ `args`: `unknown`; `toolCallId`: `string`; `toolName`: `string`; \}[]; `usage?`: `Partial`\<[`Usage`](/api/@graphorin/core/interfaces/Usage.md)\> & \{ `inputTokens?`: `number`; `outputTokens?`: `number`; `totalTokens?`: `number`; \}; \}\> | packages/provider/src/adapters/vercel.ts:109 |
| <a id="property-streamtext"></a> `streamText` | `readonly` | (`args`) => \{ `fullStream`: `AsyncIterable`\<[`AISDKChunk`](/api/@graphorin/provider/adapters/vercel/interfaces/AISDKChunk.md)\>; \} | packages/provider/src/adapters/vercel.ts:95 |
