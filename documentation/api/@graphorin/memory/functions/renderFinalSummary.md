[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / renderFinalSummary

# Function: renderFinalSummary()

```ts
function renderFinalSummary(input): string;
```

Defined in: [packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:191](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/templates/summary-9-section.ts#L191)

Render the produced summary into the final text the harness commits
to the in-flight buffer. The LLM-produced sections come from
`summaryFromLlm`; the last two are stitched in mechanically - the
preserved recent turns and the `metadata` block.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `metadata`: [`CompactionMetadataPayload`](/api/@graphorin/memory/interfaces/CompactionMetadataPayload.md); `preservedMessages`: readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[]; `summaryFromLlm`: `string`; `template`: [`RenderedTemplate`](/api/@graphorin/memory/interfaces/RenderedTemplate.md); \} |
| `input.metadata` | [`CompactionMetadataPayload`](/api/@graphorin/memory/interfaces/CompactionMetadataPayload.md) |
| `input.preservedMessages` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] |
| `input.summaryFromLlm` | `string` |
| `input.template` | [`RenderedTemplate`](/api/@graphorin/memory/interfaces/RenderedTemplate.md) |

## Returns

`string`

## Stable
