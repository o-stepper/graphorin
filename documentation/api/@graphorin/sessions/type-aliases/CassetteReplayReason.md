[**Graphorin API reference v0.10.1**](../../../index.md)

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

Defined in: [packages/sessions/src/cassette/replay.ts:27](https://github.com/o-stepper/graphorin/blob/main/packages/sessions/src/cassette/replay.ts#L27)

Operator-facing reason surfaced on every cassette decision event.

## Stable
