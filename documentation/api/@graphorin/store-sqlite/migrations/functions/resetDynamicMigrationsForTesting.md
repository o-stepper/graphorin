[**Graphorin API reference v0.10.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [migrations](/api/@graphorin/store-sqlite/migrations/index.md) / \_resetDynamicMigrationsForTesting

# Function: \_resetDynamicMigrationsForTesting()

```ts
function _resetDynamicMigrationsForTesting(): void;
```

Defined in: [packages/store-sqlite/src/migrations/registry.ts:206](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/migrations/registry.ts#L206)

**`Internal`**

Test-only helper. Drops every dynamically-registered migration so a
test can rebuild a clean registry without leaking state across cases.

## Returns

`void`
