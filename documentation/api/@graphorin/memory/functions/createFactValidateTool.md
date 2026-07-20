[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / createFactValidateTool

# Function: createFactValidateTool()

```ts
function createFactValidateTool(deps): Tool<FactValidateInput, FactValidateOutput>;
```

Defined in: packages/memory/src/tools/fact-tools.ts:448

**`Stable`**

`fact_validate` - promote a quarantined fact to active. The
validation path that admits a synthesized (consolidator / reflection)
memory into action-driving recall once it has been reviewed; the
promotion is audited in `memory_history`.

Two gates close the one-turn memory-poisoning chain
(`fact_remember(poison)` → `fact_validate(id)` → active recall):

1. `needsApproval: true` - the run suspends for a human decision
   before this tool ever executes, so the agent cannot silently
   promote any quarantined fact.
2. The underlying `SemanticMemory.validate(...)` re-checks the fact's
   text against the injection heuristics and **refuses** (no `force`
   is passed here) - an injection-flagged memory cannot be promoted by
   the agent at all. Only an operator, via the programmatic API with
   `{ force: true }`, can override after review.

Synthesized-but-clean consolidator writes promote normally once
approved.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `deps` | [`MemoryToolDeps`](/api/@graphorin/memory/interfaces/MemoryToolDeps.md) |

## Returns

[`Tool`](/api/@graphorin/core/interfaces/Tool.md)\&lt;[`FactValidateInput`](/api/@graphorin/memory/tools/interfaces/FactValidateInput.md), [`FactValidateOutput`](/api/@graphorin/memory/tools/interfaces/FactValidateOutput.md)\&gt;
