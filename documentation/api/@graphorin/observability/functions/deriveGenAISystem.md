[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / deriveGenAISystem

# Function: deriveGenAISystem()

```ts
function deriveGenAISystem(providerClassName): 
  | GenAISystem
  | null;
```

Defined in: packages/observability/src/gen-ai/system-derivation.ts:66

**`Stable`**

Derive the canonical `gen_ai.system` value from a provider class
name. Returns `null` when the name does not match any known
pattern; callers should declare `Provider.genAiSystem` explicitly
in that case.

The first time an unknown class name is seen, the function emits
one structured WARN line to the configured sink so operators
notice the gap. Subsequent lookups for the same class are silent.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `providerClassName` | `string` |

## Returns

  \| [`GenAISystem`](/api/@graphorin/observability/type-aliases/GenAISystem.md)
  \| `null`
