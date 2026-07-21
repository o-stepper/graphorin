[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / createDefaultCounter

# Function: createDefaultCounter()

```ts
function createDefaultCounter(options): TokenCounter;
```

Defined in: packages/provider/src/counters/dispatcher.ts:89

**`Stable`**

Build the recommended [TokenCounter](/api/@graphorin/core/interfaces/TokenCounter.md) for the given
`(provider, model)` pair. The dispatch table:

- Anthropic Claude → `AnthropicAPICounter` (native if `apiKey` set,
  otherwise `cl100k_base` proxy).
- OpenAI / OpenAI-compatible → `JsTiktokenCounter` with the
  family-correct encoding (`o200k_base` for gpt-4o / gpt-4.1 /
  gpt-5+ / o-series ids, `cl100k_base` otherwise - see
  `defaultOpenAiEncoding`).
- Google Gemini → `GoogleAPICounter` (cl100k_base proxy in v0.1).
- Bedrock Claude → `BedrockAPICounter` (cl100k_base proxy in v0.1).
- Ollama / unknown → `HeuristicCounter` with one WARN per process.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`CreateDefaultCounterOptions`](/api/@graphorin/provider/interfaces/CreateDefaultCounterOptions.md) |

## Returns

[`TokenCounter`](/api/@graphorin/core/interfaces/TokenCounter.md)
