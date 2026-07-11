[**Graphorin API reference v0.8.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [connection](/api/@graphorin/store-sqlite/connection/index.md) / \_resetDriverCacheForTesting

# Function: \_resetDriverCacheForTesting()

```ts
function _resetDriverCacheForTesting(): void;
```

Defined in: [packages/store-sqlite/src/connection.ts:165](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/connection.ts#L165)

**`Internal`**

Test-only helper. Drops cached driver / loader handles so the next
`openConnection(...)` call resolves them again.

## Returns

`void`
