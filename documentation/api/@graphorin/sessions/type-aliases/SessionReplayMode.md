[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionReplayMode

# Type Alias: SessionReplayMode

```ts
type SessionReplayMode = "sanitized" | "raw";
```

Defined in: packages/sessions/src/replay/types.ts:29

**`Stable`**

Mode discriminator. `'sanitized'` is the default; `'raw'` requires
the `traces:read:raw` scope.
