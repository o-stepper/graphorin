[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/triggers](/api/@graphorin/triggers/index.md) / [](/api/@graphorin/triggers/README.md) / CatchupPolicy

# Type Alias: CatchupPolicy

```ts
type CatchupPolicy = "none" | "last" | "all";
```

Defined in: packages/triggers/src/index.ts:26

Catch-up policy applied when a trigger missed one or more fires
while the scheduler was offline.

- `'none'` — drop missed fires (default; safest for personal-assistant scenarios).
- `'last'` — fire once on resume (best for cron-style daily jobs).
- `'all'` — fire each missed run up to `maxCatchupRuns` within `catchupWindowMs`.

## Stable
