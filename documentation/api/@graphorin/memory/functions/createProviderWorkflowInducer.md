[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createProviderWorkflowInducer

# Function: createProviderWorkflowInducer()

```ts
function createProviderWorkflowInducer(provider, options?): WorkflowInducer;
```

Defined in: [packages/memory/src/consolidator/phases/induce.ts:227](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/consolidator/phases/induce.ts#L227)

Resilient provider-backed inducer. A provider throw or unparseable output
degrades to `null` (no procedure) - induction never breaks the write path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `provider` | [`Provider`](/api/@graphorin/core/interfaces/Provider.md) | - |
| `options` | \{ `maxTokens?`: `number`; `onUsage?`: (`usage`) => `void`; \} | - |
| `options.maxTokens?` | `number` | - |
| `options.onUsage?` | (`usage`) => `void` | Usage callback (MCON-15) - induction is the framework's highest poisoning-risk LLM spend and previously flowed past every budget envelope. `createMemory` wires this into the consolidator budget when one is enabled; standalone callers can record it themselves. Best-effort: a throwing callback never breaks induction. |

## Returns

[`WorkflowInducer`](/api/@graphorin/memory/interfaces/WorkflowInducer.md)
