[**Graphorin API reference v0.10.2**](../../../index.md)

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

Defined in: [packages/security/src/guard/factory.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/factory.ts#L57)

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

## Stable
