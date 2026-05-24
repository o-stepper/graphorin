[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / readSessionExport

# Function: readSessionExport()

```ts
function readSessionExport(body, options?): SessionExportReadResult;
```

Defined in: packages/sessions/src/export/reader.ts:98

Parse a string body. The body must be a single block of JSONL with
a `kind: 'meta'` first line and a `kind: 'footer'` last line.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `body` | `string` |
| `options` | [`SessionExportReadOptions`](/api/@graphorin/sessions/interfaces/SessionExportReadOptions.md) |

## Returns

[`SessionExportReadResult`](/api/@graphorin/sessions/interfaces/SessionExportReadResult.md)

## Stable
