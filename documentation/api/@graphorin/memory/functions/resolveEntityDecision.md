[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / resolveEntityDecision

# Function: resolveEntityDecision()

```ts
function resolveEntityDecision(input): EntityResolveDecision;
```

Defined in: packages/memory/src/graph/entity-resolver.ts:129

**`Stable`**

Pure resolution policy: lexical exact match → embedding cosine →
ambiguous band → new. No I/O; deterministic. The caller decides what
to do with `ambiguous` (LLM adjudicate, or conservatively mint new).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`ResolveDecisionInput`](/api/@graphorin/memory/interfaces/ResolveDecisionInput.md) |

## Returns

[`EntityResolveDecision`](/api/@graphorin/memory/type-aliases/EntityResolveDecision.md)
