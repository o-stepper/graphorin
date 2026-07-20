[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / guardVariantForTier

# Function: guardVariantForTier()

```ts
function guardVariantForTier(tier): 
  | "NO_GUARD"
  | "API_BOUNDARY_GUARD"
  | "AUDIT_ONLY_GUARD"
  | "STRICT_FULL_GUARD";
```

Defined in: packages/security/src/guard/factory.ts:57

**`Stable`**

Look up the guard variant identifier for a tier. Useful for
structured logging.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `tier` | [`MemoryGuardTier`](/api/@graphorin/security/type-aliases/MemoryGuardTier.md) |

## Returns

  \| `"NO_GUARD"`
  \| `"API_BOUNDARY_GUARD"`
  \| `"AUDIT_ONLY_GUARD"`
  \| `"STRICT_FULL_GUARD"`
