[**Graphorin API reference v0.9.0**](../../../index.md)

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

Defined in: [packages/sessions/src/cassette/writer.ts:139](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/writer.ts#L139)

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
| `lines` | `string`[] | [packages/sessions/src/cassette/writer.ts:141](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/writer.ts#L141) |
| `sink` | [`ToolCassetteSink`](/api/@graphorin/sessions/interfaces/ToolCassetteSink.md) | [packages/sessions/src/cassette/writer.ts:140](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/writer.ts#L140) |
| `toString()` | () => `string` | [packages/sessions/src/cassette/writer.ts:142](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/writer.ts#L142) |

## Stable
