[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DEFAULT\_MEMORY\_TAG\_PATTERNS

# Variable: DEFAULT\_MEMORY\_TAG\_PATTERNS

```ts
const DEFAULT_MEMORY_TAG_PATTERNS: ReadonlyArray<RegExp>;
```

Defined in: [packages/security/src/guard/classifier.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/guard/classifier.ts#L44)

Set of regex patterns that hint at memory-related tools. The list
is intentionally short and English-language; deployments that need
locale-specific tagging should set `memoryGuardTier` explicitly.

## Stable
