[**Graphorin API reference v0.15.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/observability](/api/@graphorin/observability/index.md) / [telemetry](/api/@graphorin/observability/telemetry/index.md) / TelemetryStatus

# Interface: TelemetryStatus

Defined in: packages/observability/src/telemetry/index.ts:23

**`Stable`**

Result returned by [getTelemetryStatus](/api/@graphorin/observability/telemetry/functions/getTelemetryStatus.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-enabled"></a> `enabled` | `readonly` | `false` | Always `false` in v0.1. Reserved field. | packages/observability/src/telemetry/index.ts:25 |
| <a id="property-env"></a> `env?` | `readonly` | `string` | Resolved value of `GRAPHORIN_TELEMETRY` (if any). | packages/observability/src/telemetry/index.ts:29 |
| <a id="property-nophonehome"></a> `noPhoneHome?` | `readonly` | `string` | Resolved value of `GRAPHORIN_NO_PHONE_HOME` (if any). | packages/observability/src/telemetry/index.ts:31 |
| <a id="property-reason"></a> `reason` | `readonly` | `string` | Plain-English explanation of the current state. | packages/observability/src/telemetry/index.ts:27 |
