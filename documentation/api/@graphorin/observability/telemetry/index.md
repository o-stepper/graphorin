[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / telemetry

# telemetry

Zero-default telemetry stub.

The framework promises to make zero outbound network calls without
an explicit user action. This module exists so consumers can:

- inspect the telemetry posture from CLI / health endpoints,
- register the reserved `GRAPHORIN_TELEMETRY` / `GRAPHORIN_NO_PHONE_HOME`
  environment variables for forward compatibility,
- assert in tests that no implicit telemetry surface exists.

Attempting to enable telemetry pre-v0.2 returns a sentinel result; it
never opens a socket.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [TelemetryStatus](/api/@graphorin/observability/telemetry/interfaces/TelemetryStatus.md) | Result returned by [getTelemetryStatus](/api/@graphorin/observability/telemetry/functions/getTelemetryStatus.md). |

## Functions

| Function | Description |
| ------ | ------ |
| [announceTelemetryPosture](/api/@graphorin/observability/telemetry/functions/announceTelemetryPosture.md) | Detect the reserved env vars and emit one informational line per process. Returns the lines as an array so callers can route them to any sink they like (defaults to `console.info`). |
| [enableTelemetry](/api/@graphorin/observability/telemetry/functions/enableTelemetry.md) | Best-effort enable hook. Always returns the sentinel `{ status: 'disabled', reason: ... }` payload. Reserved for v0.2+. |
| [getTelemetryStatus](/api/@graphorin/observability/telemetry/functions/getTelemetryStatus.md) | Snapshot of the telemetry posture. Reads from `process.env` once unless `env` is provided. |
