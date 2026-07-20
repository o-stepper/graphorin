[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / JsonSink

# Type Alias: JsonSink

```ts
type JsonSink = (payload) => void;
```

Defined in: packages/cli/src/internal/output.ts:51

**`Internal`**

Sink the CLI uses when emitting structured JSON documents. Defaults
to writing a single trailing newline to `process.stdout`. Tests
inject a buffer.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `payload` | `unknown` |

## Returns

`void`
