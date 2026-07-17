[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / createNoGuard

# Function: createNoGuard()

```ts
function createNoGuard(tier): MemoryModificationGuard;
```

Defined in: [packages/security/src/guard/no-guard.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/no-guard.ts#L27)

Construct a `NO_GUARD` guard for the supplied tier (either
`'pure'` or `'side-effecting-no-memory'`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `tier` | `"pure"` \| `"side-effecting-no-memory"` |

## Returns

[`MemoryModificationGuard`](/api/@graphorin/security/interfaces/MemoryModificationGuard.md)

## Stable
