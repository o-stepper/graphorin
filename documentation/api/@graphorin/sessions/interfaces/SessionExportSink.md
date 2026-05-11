[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionExportSink

# Interface: SessionExportSink

Defined in: packages/sessions/src/export/writer.ts:103

Sink that consumes already-serialized JSONL lines (each carrying its
trailing newline). The default [createBufferSink](/api/@graphorin/sessions/functions/createBufferSink.md) accumulates
the full body in memory; production deployments pass a streaming
sink built on `node:stream`.

## Stable

## Methods

### write()

```ts
write(line): Promise<void>;
```

Defined in: packages/sessions/src/export/writer.ts:104

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `line` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
