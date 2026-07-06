[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / \_resetLocaleFallbackWarningsForTesting

# Function: \_resetLocaleFallbackWarningsForTesting()

```ts
function _resetLocaleFallbackWarningsForTesting(): void;
```

Defined in: [packages/memory/src/context-engine/locale-packs/resolver.ts:22](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/locale-packs/resolver.ts#L22)

**`Internal`**

Reset the once-per-process WARN registry. Used by tests for
isolation.

## Returns

`void`
