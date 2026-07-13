[**Graphorin API reference v0.9.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite](/api/@graphorin/store-sqlite/index.md) / [](/api/@graphorin/store-sqlite/README.md) / formatFtsIntegrityWarning

# Function: formatFtsIntegrityWarning()

```ts
function formatFtsIntegrityWarning(reports): string | null;
```

Defined in: [packages/store-sqlite/src/fts-integrity.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite/src/fts-integrity.ts#L93)

Format an [checkFtsIntegrity](/api/@graphorin/store-sqlite/functions/checkFtsIntegrity.md) result as a single warning line, or
`null` when the indexes are consistent. Used at store-open time.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `reports` | readonly [`FtsIntegrityReport`](/api/@graphorin/store-sqlite/interfaces/FtsIntegrityReport.md)[] |

## Returns

`string` \| `null`
