[**Graphorin API reference v0.13.10**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [fallback](/api/@graphorin/agent/fallback/index.md) / isAgentFallbackEligible

# Function: isAgentFallbackEligible()

```ts
function isAgentFallbackEligible(error, policy?): AgentFallbackEligibility;
```

Defined in: packages/agent/src/fallback/index.ts:77

**`Stable`**

Pure dispatcher that maps a [ProviderError](/api/@graphorin/core/interfaces/ProviderError.md) to one of four
eligible reasons or to `eligible: false` if the error is on the
bypass list - the `ProviderErrorKind` values `invalid-request`,
`unauthorized`, `content-filter`, and `unknown`.

The function is intentionally allocation-free on the hot path so
the agent runtime can call it once per provider error per step
without budget concerns.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | [`ProviderError`](/api/@graphorin/core/interfaces/ProviderError.md) |
| `policy` | [`AgentFallbackPolicy`](/api/@graphorin/agent/fallback/interfaces/AgentFallbackPolicy.md) |

## Returns

[`AgentFallbackEligibility`](/api/@graphorin/agent/fallback/interfaces/AgentFallbackEligibility.md)
