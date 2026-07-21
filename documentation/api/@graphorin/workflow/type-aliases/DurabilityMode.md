[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/workflow](/api/@graphorin/workflow/index.md) / [](/api/@graphorin/workflow/README.md) / DurabilityMode

# Type Alias: DurabilityMode

```ts
type DurabilityMode = "sync" | "exit";
```

Defined in: packages/workflow/src/types.ts:57

**`Stable`**

Allowed durability modes for the checkpoint writer.

The formerly advertised `'async'` mode was byte-identical to
`'sync'` (both awaited the same put), so it was removed rather than
shipped as a fake third behaviour - a fire-and-forget writer would
conflict with the compare-and-set checkpoint guard and the
only-report-real-writes contract. The runtime still coerces a
legacy `'async'` input to `'sync'` with a one-time warning.
