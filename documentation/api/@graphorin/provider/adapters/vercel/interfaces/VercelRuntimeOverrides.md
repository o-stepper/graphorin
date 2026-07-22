[**Graphorin API reference v0.14.0**](../../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [adapters/vercel](/api/@graphorin/provider/adapters/vercel/index.md) / VercelRuntimeOverrides

# Interface: VercelRuntimeOverrides

Defined in: packages/provider/src/adapters/vercel.ts:95

**`Stable`**

Subset of the AI SDK surface used by the adapter.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-generatetext"></a> `generateText` | `readonly` | (`args`) => `Promise`\<\{ `finishReason?`: `string`; `providerMetadata?`: `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\>; `text?`: `string`; `toolCalls?`: readonly \{ `args`: `unknown`; `toolCallId`: `string`; `toolName`: `string`; \}[]; `usage?`: `Partial`\&lt;[`Usage`](/api/@graphorin/core/interfaces/Usage.md)\&gt; & \{ `inputTokens?`: `number`; `outputTokens?`: `number`; `totalTokens?`: `number`; \}; \}\> | packages/provider/src/adapters/vercel.ts:110 |
| <a id="property-streamtext"></a> `streamText` | `readonly` | (`args`) => \{ `fullStream`: `AsyncIterable`\&lt;[`AISDKChunk`](/api/@graphorin/provider/adapters/vercel/interfaces/AISDKChunk.md)\&gt;; \} | packages/provider/src/adapters/vercel.ts:96 |
