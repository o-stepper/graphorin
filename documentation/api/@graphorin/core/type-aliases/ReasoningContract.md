[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/core](/api/@graphorin/core/index.md) / [](/api/@graphorin/core/README.md) / ReasoningContract

# Type Alias: ReasoningContract

```ts
type ReasoningContract = "hidden" | "round-trip-required" | "optional";
```

Defined in: [packages/core/src/contracts/reasoning-retention.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/core/src/contracts/reasoning-retention.ts#L52)

Capability declaration on `ProviderCapabilities` describing how the
provider treats reasoning content. The field is auto-populated per
provider family by the adapter; consumers use it to infer the
default [ReasoningRetention](/api/@graphorin/core/type-aliases/ReasoningRetention.md) value for a request.

## Stable
