[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createProviderWorkflowInducer

# Function: createProviderWorkflowInducer()

```ts
function createProviderWorkflowInducer(provider, options?): WorkflowInducer;
```

Defined in: packages/memory/src/consolidator/phases/induce.ts:226

Resilient provider-backed inducer. A provider throw or unparseable output
degrades to `null` (no procedure) — induction never breaks the write path.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `provider` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) |
| `options` | \{ `maxTokens?`: `number`; \} |
| `options.maxTokens?` | `number` |

## Returns

[`WorkflowInducer`](/api/@graphorin/memory/interfaces/WorkflowInducer.md)
