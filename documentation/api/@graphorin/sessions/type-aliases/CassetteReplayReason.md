[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / [](/api/@graphorin/sessions/README.md) / CassetteReplayReason

# Type Alias: CassetteReplayReason

```ts
type CassetteReplayReason = 
  | "auto-policy"
  | "auto-policy-safety-gate"
  | "live-mode-forced"
  | "mixed-mode-per-tool"
  | "idempotency-mismatch-fallback";
```

Defined in: packages/sessions/src/cassette/replay.ts:27

**`Stable`**

Operator-facing reason surfaced on every cassette decision event.
