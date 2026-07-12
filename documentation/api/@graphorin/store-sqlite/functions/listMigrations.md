[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / listMigrations

# Function: listMigrations()

```ts
function listMigrations(): readonly Migration[];
```

Defined in: [packages/store-sqlite/src/migrations/registry.ts:154](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/migrations/registry.ts#L154)

Returns the full ordered migration list (built-ins + any registered
dynamic migrations). Sorted by `version`. Verifies that no two entries
share the same version.

## Returns

readonly [`Migration`](/api/@graphorin/store-sqlite/interfaces/Migration.md)[]

## Stable
