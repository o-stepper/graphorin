---
'@graphorin/observability': minor
---

fix(observability): make the inert tracing knobs effective (RP-19)

Five documented-but-inert observability controls:

- **`defaultAttributeSensitivity`** was read and then discarded (`void`). It now
  tags a span's untagged initial attributes, so the configured tier actually
  governs whether they survive redaction (builds on RP-18).
- **`'rate-limit'` sampler** had no branch — it was identical to the
  probabilistic path. It is now a real per-second token-window limiter
  (`maxPerSecond`, injectable `now`).
- **Parent-based sampling** used `parentId !== undefined` as "parent sampled",
  so a child of a sampled-out parent was always recorded as an orphan. It now
  follows the parent's real decision (`asGraphorinSpan` distinguishes a sampled
  span from a noop) — a child of an unsampled parent is not recorded.
- **`ReplayLogConfig.autoPrune`** defaulted to `enabled: true` but nothing
  consumes it; the default is now `enabled: false` (a declarative hint, not an
  inert default-on) and the doc says so.
- **`getTraceLog`** doc claimed malformed lines are emitted as `null`; it
  skips them. Doc corrected.

Red-first tests cover the rate-limit cap, a child of an unsampled parent not
being recorded, and `defaultAttributeSensitivity: 'public'` letting an untagged
attribute survive.
