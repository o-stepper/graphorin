[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/tools](/api/@graphorin/tools/index.md) / [](/api/@graphorin/tools/README.md) / DEFAULT\_MAX\_BUFFER\_BYTES

# Variable: DEFAULT\_MAX\_BUFFER\_BYTES

```ts
const DEFAULT_MAX_BUFFER_BYTES: number;
```

Defined in: [packages/tools/src/streaming/channel.ts:36](https://github.com/o-stepper/graphorin/blob/main/packages/tools/src/streaming/channel.ts#L36)

W-117: default byte cap on the per-call aggregation buffer. Generous -
an ordinary tool result is orders of magnitude smaller; the cap exists
so an unbounded streaming producer cannot exhaust host memory.

## Stable
