# Example apps - tracing and diagnostics

**Graphorin** v0.11.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

Every package under `examples/*` can emit OpenTelemetry-style spans when you opt in via environment variables. Nothing is exported by default - consistent with the framework's privacy stance.

## Console spans (`GRAPHORIN_TRACE`)

Set **`GRAPHORIN_TRACE=console`** (or `1`, `true`, `yes`, `on`) before starting an example. Each app wires `optionalTracerFromEnv` from `@graphorin/example-trace-helper`, which attaches `@graphorin/observability`'s console exporter and prints finished spans to stderr/stdout.

Use this when you want immediate visibility into provider calls, agent steps, or workflow checkpoints without running a collector.

## Persisted traces (`graphorin traces`)

The operator CLI command **`graphorin traces status`** reads rows from the SQLite **`traces`** table inside your configured store. That path is populated when the **standalone server** (or another deployment) exports spans through a store-backed exporter - not by the library-mode examples alone.

Typical workflow:

1. Run **`graphorin start`** with tracing configured for your environment.
2. Exercise agents or workflows through REST/WebSocket.
3. Inspect **`graphorin traces status`** (and **`graphorin traces prune`** when enforcing TTL).

## Further reading

- Package **`@graphorin/observability`** - tracer factories and redaction helpers used across the monorepo.
- Package **`@graphorin/cli`** - `graphorin traces`, `graphorin telemetry`, and related diagnostics.
