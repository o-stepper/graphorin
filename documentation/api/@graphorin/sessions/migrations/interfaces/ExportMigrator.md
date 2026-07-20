[**Graphorin API reference v0.13.6**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [migrations](/api/@graphorin/sessions/migrations/index.md) / ExportMigrator

# Interface: ExportMigrator

Defined in: packages/sessions/src/migrations/index.ts:22

**`Stable`**

Migrator entry. Both sides of the version pair are
`'MAJOR.MINOR'` strings.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | packages/sessions/src/migrations/index.ts:25 |
| <a id="property-fromversion"></a> `fromVersion` | `readonly` | `string` | packages/sessions/src/migrations/index.ts:23 |
| <a id="property-toversion"></a> `toVersion` | `readonly` | `string` | packages/sessions/src/migrations/index.ts:24 |

## Methods

### migrate()

```ts
migrate(records): readonly SessionExportRecord[];
```

Defined in: packages/sessions/src/migrations/index.ts:26

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `records` | readonly [`SessionExportParsedRecord`](/api/@graphorin/sessions/type-aliases/SessionExportParsedRecord.md)[] |

#### Returns

readonly [`SessionExportRecord`](/api/@graphorin/sessions/type-aliases/SessionExportRecord.md)[]
