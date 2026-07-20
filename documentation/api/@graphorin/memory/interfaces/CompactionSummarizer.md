[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / CompactionSummarizer

# Interface: CompactionSummarizer

Defined in: packages/memory/src/context-engine/compaction/types.ts:302

**`Stable`**

Summarizer adapter - accepts a prompt and returns the produced
summary. The Phase 06 `Provider` adapters implement this
signature; tests pass a deterministic stub. The summarizer
adapter is intentionally narrow so the compaction subsystem
does not take the heavier `Provider` dependency directly.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-id"></a> `id?` | `readonly` | `string` | packages/memory/src/context-engine/compaction/types.ts:314 |

## Methods

### summarize()

```ts
summarize(input): Promise<{
  text: string;
  usageTokens?: number;
}>;
```

Defined in: packages/memory/src/context-engine/compaction/types.ts:308

Produce a summary text for the supplied prompt. The prompt is
built by the compactor using the configured section template;
the adapter is responsible for invoking the underlying LLM.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `model?`: `string` \| [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md); `prompt`: `string`; `signal?`: `AbortSignal`; `timeoutMs?`: `number`; \} |
| `input.model?` | `string` \| [`ModelSpec`](/api/@graphorin/core/type-aliases/ModelSpec.md) |
| `input.prompt` | `string` |
| `input.signal?` | `AbortSignal` |
| `input.timeoutMs?` | `number` |

#### Returns

`Promise`\<\{
  `text`: `string`;
  `usageTokens?`: `number`;
\}\>
