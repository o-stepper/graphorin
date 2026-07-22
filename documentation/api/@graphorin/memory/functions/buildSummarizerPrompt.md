[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / buildSummarizerPrompt

# Function: buildSummarizerPrompt()

```ts
function buildSummarizerPrompt(input): string;
```

Defined in: packages/memory/src/context-engine/compaction/templates/summary-9-section.ts:78

**`Stable`**

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

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | \{ `maxDumpChars?`: `number`; `olderMessages`: readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[]; `template`: [`RenderedTemplate`](/api/@graphorin/memory/interfaces/RenderedTemplate.md); \} | - |
| `input.maxDumpChars?` | `number` | Character budget for the message dump. When the rendered dump exceeds it, the OLDEST lines are elided (newest kept) and a marker notes how many were dropped. `undefined` ⇒ default `DEFAULT_SUMMARIZER_DUMP_CHAR_BUDGET`; `0` disables the cap. |
| `input.olderMessages` | readonly [`Message`](/api/@graphorin/core/type-aliases/Message.md)[] | - |
| `input.template` | [`RenderedTemplate`](/api/@graphorin/memory/interfaces/RenderedTemplate.md) | - |

## Returns

`string`
