[**Graphorin API reference v0.3.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [fanout](/api/@graphorin/agent/fanout/index.md) / PerChildBudget

# Interface: PerChildBudget

Defined in: packages/agent/src/fanout/index.ts:24

Per-child budget. Defaults derived from the canonical 2026
scaling-rule table for agent fan-out workloads.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-durationms"></a> `durationMs?` | `readonly` | `number` | packages/agent/src/fanout/index.ts:27 |
| <a id="property-tokens"></a> `tokens?` | `readonly` | `number` | packages/agent/src/fanout/index.ts:25 |
| <a id="property-toolcalls"></a> `toolCalls?` | `readonly` | `number` | packages/agent/src/fanout/index.ts:26 |
