[**Graphorin API reference v0.13.8**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / createCassetteBufferSink

# Function: createCassetteBufferSink()

```ts
function createCassetteBufferSink(): {
  lines: string[];
  sink: ToolCassetteSink;
  toString: string;
};
```

Defined in: packages/sessions/src/cassette/writer.ts:139

**`Stable`**

Convenience: a sink that buffers every line into a `string[]`.

## Returns

```ts
{
  lines: string[];
  sink: ToolCassetteSink;
  toString: string;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `lines` | `string`[] | packages/sessions/src/cassette/writer.ts:141 |
| `sink` | [`ToolCassetteSink`](/api/@graphorin/sessions/interfaces/ToolCassetteSink.md) | packages/sessions/src/cassette/writer.ts:140 |
| `toString()` | () => `string` | packages/sessions/src/cassette/writer.ts:142 |
