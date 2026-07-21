[**Graphorin API reference v0.13.11**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [run-state](/api/@graphorin/agent/run-state/index.md) / SerializeRunStateOptions

# Interface: SerializeRunStateOptions

Defined in: packages/agent/src/run-state/index.ts:111

**`Stable`**

Options accepted by [serializeRunState](/api/@graphorin/agent/run-state/functions/serializeRunState.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-striptracingapikey"></a> `stripTracingApiKey?` | `readonly` | `boolean` | Deep-redact secret-named keys (`apiKey`, `authorization`, `bearerToken` / `accessToken` / `refreshToken`, `password`, `secret`, …) anywhere in the snapshot - tool results and messages included - replacing their values with `'[redacted]'`. Defaults to `false` for the round-trip canonical helper; the agent runtime passes `true` when persisting through the checkpoint store. Redaction is best-effort by key name: secrets stored under unrelated keys are not detected. | packages/agent/src/run-state/index.ts:122 |
