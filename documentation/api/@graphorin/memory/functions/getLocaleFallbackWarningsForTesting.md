[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / \_getLocaleFallbackWarningsForTesting

# Function: \_getLocaleFallbackWarningsForTesting()

```ts
function _getLocaleFallbackWarningsForTesting(): ReadonlyMap<string, ReadonlySet<string>>;
```

Defined in: [packages/memory/src/context-engine/locale-packs/resolver.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/locale-packs/resolver.ts#L31)

**`Internal`**

Inspect the once-per-process WARN registry. Used by tests.

## Returns

`ReadonlyMap`\<`string`, `ReadonlySet`\&lt;`string`\&gt;\>
