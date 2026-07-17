[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / runConflictPipeline

# Function: runConflictPipeline()

```ts
function runConflictPipeline(args): Promise<ConflictDecision>;
```

Defined in: [packages/memory/src/conflict/pipeline.ts:50](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/pipeline.ts#L50)

One-shot helper that mirrors RB-02 §8.1's `runConflictPipeline({...})`
spec - convenient for callers that do not need to pre-build + cache
the pipeline. Production wiring should still go through
[createConflictPipeline](/api/@graphorin/memory/functions/createConflictPipeline.md) (`SemanticMemory` re-uses the cached
instance per `Memory`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `candidate`: [`Fact`](/api/@graphorin/core/interfaces/Fact.md); `deps`: [`ConflictPipelineDeps`](/api/@graphorin/memory/interfaces/ConflictPipelineDeps.md); `options?`: [`ConflictPipelineOptions`](/api/@graphorin/memory/interfaces/ConflictPipelineOptions.md); \} |
| `args.candidate` | [`Fact`](/api/@graphorin/core/interfaces/Fact.md) |
| `args.deps` | [`ConflictPipelineDeps`](/api/@graphorin/memory/interfaces/ConflictPipelineDeps.md) |
| `args.options?` | [`ConflictPipelineOptions`](/api/@graphorin/memory/interfaces/ConflictPipelineOptions.md) |

## Returns

`Promise`\&lt;[`ConflictDecision`](/api/@graphorin/memory/type-aliases/ConflictDecision.md)\&gt;

## Stable
