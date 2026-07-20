[**Graphorin API reference v0.13.8**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [migrations](/api/@graphorin/sessions/migrations/index.md) / migrateExport

# Function: migrateExport()

```ts
function migrateExport(
   records, 
   fromVersion, 
   toVersion): readonly SessionExportRecord[];
```

Defined in: packages/sessions/src/migrations/index.ts:60

**`Stable`**

Walk the registered migrators to advance `records` from
`fromVersion` to `toVersion`. Throws when no chain exists.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `records` | readonly [`SessionExportParsedRecord`](/api/@graphorin/sessions/type-aliases/SessionExportParsedRecord.md)[] |
| `fromVersion` | `string` |
| `toVersion` | `string` |

## Returns

readonly [`SessionExportRecord`](/api/@graphorin/sessions/type-aliases/SessionExportRecord.md)[]
