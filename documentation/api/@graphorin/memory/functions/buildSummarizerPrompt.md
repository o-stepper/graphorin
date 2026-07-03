[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / buildSummarizerPrompt

# Function: buildSummarizerPrompt()

```ts
function buildSummarizerPrompt(input): string;
```

Defined in: packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:73

Build the prompt the summarizer LLM receives. The prompt
contains:

 1. The locale-resolved preamble.
 2. The verbatim section list (1-9, with a note that section 8
    is filled by the harness).
 3. A delimited dump of the older messages the harness is about
    to drop.

The summarizer produces every section except the last two; those
(recent turns + metadata) are stitched in by the harness before the
result is committed to the in-flight buffer.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | \{ `olderMessages`: readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[]; `template`: [`RenderedTemplate`](/api/@graphorin/memory/interfaces/RenderedTemplate.md); \} |
| `input.olderMessages` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] |
| `input.template` | [`RenderedTemplate`](/api/@graphorin/memory/interfaces/RenderedTemplate.md) |

## Returns

`string`

## Stable
