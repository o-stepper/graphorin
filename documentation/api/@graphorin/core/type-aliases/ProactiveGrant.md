[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ProactiveGrant

# Type Alias: ProactiveGrant

```ts
type ProactiveGrant = ProactiveOutcomeKind;
```

Defined in: packages/core/src/types/proactive.ts:51

**`Stable`**

Maximum rung a proactive task may produce. A task declares its grant
once (default `'notify'`); the runner clamps or rejects outcomes
above it. `'act'` additionally requires the memory ingest gate to be
active (fail-closed config check in the proactive runner).
