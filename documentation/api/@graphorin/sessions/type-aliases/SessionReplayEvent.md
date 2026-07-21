[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / SessionReplayEvent

# Type Alias: SessionReplayEvent

```ts
type SessionReplayEvent = 
  | ReplayEvent
  | CassetteReplayDecision;
```

Defined in: packages/sessions/src/replay/types.ts:74

**`Stable`**

Single event yielded by `Session.replay({...})`. Combines the
sanitized observability replay events + the cassette-driven
decisions surfaced by the cassette engine.
