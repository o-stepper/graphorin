[**Graphorin API reference v0.13.12**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [run-state](/api/@graphorin/agent/run-state/index.md) / DeserializeOptions

# Interface: DeserializeOptions

Defined in: packages/agent/src/run-state/index.ts:247

**`Stable`**

Options accepted by [deserializeRunState](/api/@graphorin/agent/run-state/functions/deserializeRunState.md) / [runStateFromJSON](/api/@graphorin/agent/run-state/functions/runStateFromJSON.md).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-logger"></a> `logger?` | `readonly` | (`message`) => `void` | Logger callback for one-time INFO messages emitted on backwards-compat synthesis. Defaults to a no-op. | packages/agent/src/run-state/index.ts:258 |
| <a id="property-synthesizeusagebymodel"></a> `synthesizeUsageByModel?` | `readonly` | `boolean` | Synthesize `usageByModel` from a v0.1-alpha state that omits the field. Defaults to `true` so callers can rehydrate older states without explicit migration. | packages/agent/src/run-state/index.ts:253 |
