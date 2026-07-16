---
'@graphorin/tools': patch
---

Fix `SanitizationOutcome.bytesStripped` going negative (e2e 2026-07-13, TOOLS-EX-01 / CHANNELS-01, minor). The inbound sanitizer computed `bytesStripped` as the net length delta, but the strip pass REPLACES each match with a redaction mask, and the canonical masks (e.g. `[REDACTED:imperative-pattern]`) are longer than the text they cover, so the value went negative - contradicting its documented "bytes removed" meaning (also surfaced through the `@graphorin/channels` re-export). It is now clamped to a non-negative net-bytes-removed metric (`0` when the masks are at least as long as what they covered, even though matches were stripped - `stripped` / `patternsHit` still report the redaction). Regression assertion added.
