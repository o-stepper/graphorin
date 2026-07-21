[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / PrintSink

# Type Alias: PrintSink

```ts
type PrintSink = (line) => void;
```

Defined in: packages/cli/src/internal/output.ts:32

**`Internal`**

Sink the CLI subcommands write human-readable lines through. The
default sink writes a trailing newline to `process.stderr`. Tests
inject a buffer.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `line` | `string` |

## Returns

`void`
