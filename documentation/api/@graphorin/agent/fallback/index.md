[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / fallback

# fallback

Agent-level model fallback chain primitives.

The agent runtime walks `[primaryModel, ...Agent.fallbackModels]`
on fallback-eligible errors during the per-step provider call.
`isAgentFallbackEligible(...)` is the pure decision function the
runtime calls once per `ProviderError`.

Layering: this module is the **agent-step-level** fallback
(re-tries the whole step against a different model on rate-limit
/ capacity / context-length / transient errors). The
**request-level** `withFallback` provider middleware
(`@graphorin/provider`) is a separate concern - it retries against
an alternate provider serving the **same** model concept on
transient errors inside one `provider.stream(...)` call.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [AgentFallbackEligibility](/api/@graphorin/agent/fallback/interfaces/AgentFallbackEligibility.md) | Outcome of [isAgentFallbackEligible](/api/@graphorin/agent/fallback/functions/isAgentFallbackEligible.md). |
| [AgentFallbackPolicy](/api/@graphorin/agent/fallback/interfaces/AgentFallbackPolicy.md) | Operator-supplied policy that lets the consumer toggle which `ProviderError` kinds the agent runtime should consider eligible for whole-step retries against the next model in the chain. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [AgentFallbackReason](/api/@graphorin/agent/fallback/type-aliases/AgentFallbackReason.md) | Stable taxonomy returned by [isAgentFallbackEligible](/api/@graphorin/agent/fallback/functions/isAgentFallbackEligible.md) on eligible errors. |

## Functions

| Function | Description |
| ------ | ------ |
| [isAgentFallbackEligible](/api/@graphorin/agent/fallback/functions/isAgentFallbackEligible.md) | Pure dispatcher that maps a [ProviderError](/api/@graphorin/core/interfaces/ProviderError.md) to one of four eligible reasons or to `eligible: false` if the error is on the bypass list - the `ProviderErrorKind` values `invalid-request`, `unauthorized`, `content-filter`, and `unknown`. |
