[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / emitGenAIMessageEvents

# Function: emitGenAIMessageEvents()

```ts
function emitGenAIMessageEvents<T>(
   span, 
   messages, 
   opts?): void;
```

Defined in: packages/observability/src/gen-ai/emit.ts:93

Emit per-message OpenTelemetry GenAI span events. The helper records
one event per message — the per-message-event emission shape per the
OTel semconv discipline (size-bounded individually; safer than the
aggregate-attribute shape on large prompts).

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`SpanType`](/api/@graphorin/core/type-aliases/SpanType.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `span` | [`AISpan`](/api/@graphorin/core/interfaces/AISpan.md)\&lt;`T`\&gt; |
| `messages` | readonly [`GenAIMessage`](/api/@graphorin/observability/interfaces/GenAIMessage.md)[] |
| `opts` | \{ `system?`: `string`; \} |
| `opts.system?` | `string` |

## Returns

`void`

## Stable
