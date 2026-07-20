[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [](/api/@graphorin/observability/README.md) / ReplayMode

# Type Alias: ReplayMode

```ts
type ReplayMode = "sanitized" | "raw";
```

Defined in: packages/observability/src/replay/types.ts:20

**`Stable`**

Replay scope hint. Server mode requires `'raw'` to be backed by a
token carrying the `traces:read:raw` scope. The library mode uses
the same flag but without scope enforcement (the server is the only
boundary that can grant `'raw'`).
