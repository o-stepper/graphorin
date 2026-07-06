[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / ReplayMode

# Type Alias: ReplayMode

```ts
type ReplayMode = "sanitized" | "raw";
```

Defined in: [packages/observability/src/replay/types.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/observability/src/replay/types.ts#L20)

Replay scope hint. Server mode requires `'raw'` to be backed by a
token carrying the `traces:read:raw` scope. The library mode uses
the same flag but without scope enforcement (the server is the only
boundary that can grant `'raw'`).

## Stable
