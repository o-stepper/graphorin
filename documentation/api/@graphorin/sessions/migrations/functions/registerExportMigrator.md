[**Graphorin API reference v0.13.9**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [migrations](/api/@graphorin/sessions/migrations/index.md) / registerExportMigrator

# Function: registerExportMigrator()

```ts
function registerExportMigrator(migrator): void;
```

Defined in: packages/sessions/src/migrations/index.ts:37

**`Stable`**

Register a migrator. Idempotent on the `(fromVersion, toVersion)`
pair - re-registering replaces the prior entry.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `migrator` | [`ExportMigrator`](/api/@graphorin/sessions/migrations/interfaces/ExportMigrator.md) |

## Returns

`void`
