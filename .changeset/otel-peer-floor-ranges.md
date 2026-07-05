---
'@graphorin/observability': patch
---

OpenTelemetry peer ranges fixed (W-014): `@opentelemetry/sdk-node` and `@opentelemetry/exporter-trace-otlp-http` peers were caret-pinned to two DIFFERENT experimental 0.x minors (`^0.217.0` and `^0.215.0`) - on 0.x a caret pins the minor, otel requires version-matched experimental packages, and the current otel line satisfied neither pin, so following the observability guide ended in a hard `npm ERESOLVE`. Both peers are now the floor range `>=0.215.0 <1.0.0` (otel ships experimental minors monthly; a caret goes stale immediately and lockstep pin-bumping would require a release per otel minor), and the devDependencies moved to one current lockstep line (`^0.220.0`, tests green on it). `@opentelemetry/api ^1.9.0` (stable 1.x) is untouched. The pack gate's otel-freshness leg installs the packed tarball together with `@latest` of both packages, so future incompatibilities surface in CI before users hit them.
