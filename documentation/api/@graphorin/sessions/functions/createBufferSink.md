[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / createBufferSink

# Function: createBufferSink()

```ts
function createBufferSink(): {
  lines: string[];
  sink: SessionExportSink;
  toString: string;
};
```

Defined in: packages/sessions/src/export/writer.ts:227

Convenience: a sink that buffers every line into a `string[]`. Used
by tests + the simple in-memory export path.

## Returns

```ts
{
  lines: string[];
  sink: SessionExportSink;
  toString: string;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `lines` | `string`[] | packages/sessions/src/export/writer.ts:229 |
| `sink` | [`SessionExportSink`](/api/@graphorin/sessions/interfaces/SessionExportSink.md) | packages/sessions/src/export/writer.ts:228 |
| `toString()` | () => `string` | packages/sessions/src/export/writer.ts:230 |

## Stable
