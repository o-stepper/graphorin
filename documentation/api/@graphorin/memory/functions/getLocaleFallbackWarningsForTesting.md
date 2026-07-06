[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / \_getLocaleFallbackWarningsForTesting

# Function: \_getLocaleFallbackWarningsForTesting()

```ts
function _getLocaleFallbackWarningsForTesting(): ReadonlyMap<string, ReadonlySet<string>>;
```

Defined in: packages/memory/src/context-engine/locale-packs/resolver.ts:31

**`Internal`**

Inspect the once-per-process WARN registry. Used by tests.

## Returns

`ReadonlyMap`\&lt;`string`, `ReadonlySet`\&lt;`string`\&gt;\&gt;
