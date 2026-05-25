[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / renderFinalSummary

# Function: renderFinalSummary()

```ts
function renderFinalSummary(input): string;
```

Defined in: packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:121

Render the produced summary into the final 9-section text the
harness commits to the in-flight buffer. Sections 1-7 + 9 are
stitched in from `summaryFromLlm` + `metadata`; section 8 is the
verbatim render of the preserved recent turns (mechanical).

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
