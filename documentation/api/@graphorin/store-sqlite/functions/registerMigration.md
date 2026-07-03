[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / registerMigration

# Function: registerMigration()

```ts
function registerMigration(migration): void;
```

Defined in: packages/store-sqlite/src/migrations/registry.ts:118

Register a runtime-supplied migration. Used by downstream packages
that want to ship their schema alongside the bundled set without
forking this package.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `migration` | [`Migration`](/api/@graphorin/store-sqlite/interfaces/Migration.md) |

## Returns

`void`

## Stable
