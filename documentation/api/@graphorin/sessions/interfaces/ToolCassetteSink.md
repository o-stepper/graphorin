[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ToolCassetteSink

# Interface: ToolCassetteSink

Defined in: packages/sessions/src/cassette/writer.ts:27

**`Stable`**

Sink that consumes already-serialized JSONL lines (each carrying
its trailing newline). Mirrors the export sink shape so callers
can plug a streaming `node:stream` writer in.

## Methods

### write()

```ts
write(line): Promise<void>;
```

Defined in: packages/sessions/src/cassette/writer.ts:28

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `line` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
