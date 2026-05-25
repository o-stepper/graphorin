[**Graphorin API reference v0.4.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [fallback](/api/@graphorin/agent/fallback/index.md) / AgentFallbackPolicy

# Interface: AgentFallbackPolicy

Defined in: packages/agent/src/fallback/index.ts:29

Operator-supplied policy that lets the consumer toggle which
`ProviderError` kinds the agent runtime should consider eligible
for whole-step retries against the next model in the chain.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-capacityeligible"></a> `capacityEligible?` | `readonly` | `boolean` | Default `true`. | packages/agent/src/fallback/index.ts:33 |
| <a id="property-contextlengtheligible"></a> `contextLengthEligible?` | `readonly` | `boolean` | Default `true`. | packages/agent/src/fallback/index.ts:35 |
| <a id="property-ratelimiteligible"></a> `rateLimitEligible?` | `readonly` | `boolean` | Default `true`. | packages/agent/src/fallback/index.ts:31 |
| <a id="property-transienteligible"></a> `transientEligible?` | `readonly` | `boolean` | Default `false` — `withRetry` already covers transient errors. | packages/agent/src/fallback/index.ts:37 |
