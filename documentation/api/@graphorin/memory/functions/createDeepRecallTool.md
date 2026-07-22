[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createDeepRecallTool

# Function: createDeepRecallTool()

```ts
function createDeepRecallTool(deps): Tool<DeepRecallInput, DeepRecallOutput>;
```

Defined in: packages/memory/src/tools/recall-tools.ts:252

**`Stable`**

`deep_recall` - gated, multi-pass ("deep") recall over the user's
factual memory for HARD questions. A local difficulty gate keeps
simple lookups single-shot; only queries judged hard trigger a
grade-and-reformulate loop (bounded by `maxIterations`, hard-capped at
5), widening to one-hop graph expansion on reformulation passes. The
output reports `abstained: true` when memory was insufficient even
after reformulating - the agent should then say it lacks the
information rather than guess. Registered only when the facade is
created with `iterativeRetrieval`; otherwise it degrades to a single
pass, so prefer the cheaper `fact_search` for ordinary lookups.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;[`DeepRecallInput`](/api/@graphorin/memory/tools/interfaces/DeepRecallInput.md), [`DeepRecallOutput`](/api/@graphorin/memory/tools/interfaces/DeepRecallOutput.md)\&gt;
