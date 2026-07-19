[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / classifyTool

# Function: classifyTool()

```ts
function classifyTool(tool, patterns?): MemoryGuardTier;
```

Defined in: packages/security/src/guard/classifier.ts:63

**`Stable`**

Classify a tool. Pure function - never inspects runtime state.

Precedence (top wins):
  1. Operator-set `memoryGuardTier`.
  2. `trustLevel === 'untrusted'` → `'untrusted'`.
  3. Tags or `secretsAllowed` mention memory → `'memory-aware'`.
  4. Default → `'unknown'`.

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `tool` | [`ClassifiableTool`](/api/@graphorin/security/interfaces/ClassifiableTool.md) | `undefined` |
| `patterns` | readonly `RegExp`[] | `DEFAULT_MEMORY_TAG_PATTERNS` |

## Returns

[`MemoryGuardTier`](/api/@graphorin/security/type-aliases/MemoryGuardTier.md)
