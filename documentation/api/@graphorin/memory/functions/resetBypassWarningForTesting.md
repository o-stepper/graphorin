[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / \_resetBypassWarningForTesting

# Function: \_resetBypassWarningForTesting()

```ts
function _resetBypassWarningForTesting(): void;
```

Defined in: [packages/memory/src/conflict/pipeline.ts:37](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/pipeline.ts#L37)

**`Internal`**

Reset the one-shot bypass-warning flag. Test-only helper - production
callers never invoke this.

## Returns

`void`
