[**Graphorin API reference v0.13.3**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [fanout](/api/@graphorin/agent/fanout/index.md) / PerChildBudget

# Interface: PerChildBudget

Defined in: packages/agent/src/fanout/index.ts:34

**`Stable`**

Per-child budget. Defaults derived from the canonical 2026
scaling-rule table for agent fan-out workloads.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-durationms"></a> `durationMs?` | `readonly` | `number` | Wall-clock cap, enforced for every child via a race timer. | packages/agent/src/fanout/index.ts:48 |
| <a id="property-tokens"></a> `tokens?` | `readonly` | `number` | Max `usage.totalTokens` per child. Enforced **post-hoc** and only for usage-reporting children (an `invoke` that resolves to a full `AgentResult` - e.g. `() => child.run(input)`); a child returning a plain value reports `tokensUsed: 0` and this cap cannot fire. | packages/agent/src/fanout/index.ts:41 |
| <a id="property-toolcalls"></a> `toolCalls?` | `readonly` | `number` | Max tool calls per child. Same usage-reporting contract as [PerChildBudget.tokens](/api/@graphorin/agent/fanout/interfaces/PerChildBudget.md#property-tokens) (counted from `state.steps`). | packages/agent/src/fanout/index.ts:46 |
