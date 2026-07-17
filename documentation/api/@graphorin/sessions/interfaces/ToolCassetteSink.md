[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / ToolCassetteSink

# Interface: ToolCassetteSink

Defined in: [packages/sessions/src/cassette/writer.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/writer.ts#L27)

Sink that consumes already-serialized JSONL lines (each carrying
its trailing newline). Mirrors the export sink shape so callers
can plug a streaming `node:stream` writer in.

## Stable

## Methods

### write()

```ts
write(line): Promise<void>;
```

Defined in: [packages/sessions/src/cassette/writer.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/writer.ts#L28)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `line` | `string` |

#### Returns

`Promise`\&lt;`void`\&gt;
