[**Graphorin API reference v0.3.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [run-state](/api/@graphorin/agent/run-state/index.md) / SerializeRunStateOptions

# Interface: SerializeRunStateOptions

Defined in: packages/agent/src/run-state/index.ts:71

Options accepted by [serializeRunState](/api/@graphorin/agent/run-state/functions/serializeRunState.md).

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-striptracingapikey"></a> `stripTracingApiKey?` | `readonly` | `boolean` | Drop tracing API keys and other secrets that callers store in `RunContext.deps`. Defaults to `false` for the round-trip canonical helper; the agent runtime always passes `true` when persisting through the checkpoint store. | packages/agent/src/run-state/index.ts:78 |
