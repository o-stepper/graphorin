[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionReplayMode

# Type Alias: SessionReplayMode

```ts
type SessionReplayMode = "sanitized" | "raw";
```

Defined in: [packages/sessions/src/replay/types.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/replay/types.ts#L29)

Mode discriminator. `'sanitized'` is the default; `'raw'` requires
the `traces:read:raw` scope.

## Stable
