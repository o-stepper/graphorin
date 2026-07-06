[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / FtsIntegrityReport

# Interface: FtsIntegrityReport

Defined in: [packages/store-sqlite/src/fts-integrity.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/fts-integrity.ts#L51)

One FTS table's integrity finding.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-orphanrows"></a> `orphanRows` | `readonly` | `number` | FTS rows whose `rowid` matches no row in the base table. | [packages/store-sqlite/src/fts-integrity.ts:55](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/fts-integrity.ts#L55) |
| <a id="property-table"></a> `table` | `readonly` | `string` | The FTS table inspected. | [packages/store-sqlite/src/fts-integrity.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/fts-integrity.ts#L53) |
