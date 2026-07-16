---
'@graphorin/observability': patch
---

Export `toOtlpEnvelope` (e2e 2026-07-13, OBS-PRIC-01, minor). The observability and migration guides document `toOtlpEnvelope` as the exported helper for adapting Graphorin spans into an upstream OTel SDK pipeline, but it was marked `@internal` and re-exported from no public entry point, so it was unreachable. It is now a `@stable` export from `@graphorin/observability` (and the `./exporters` subpath).
