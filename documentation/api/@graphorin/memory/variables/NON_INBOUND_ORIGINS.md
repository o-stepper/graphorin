[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / NON\_INBOUND\_ORIGINS

# Variable: NON\_INBOUND\_ORIGINS

```ts
const NON_INBOUND_ORIGINS: ReadonlySet<ContentOrigin>;
```

Defined in: packages/memory/src/context-engine/annotations.ts:96

Origins for which the inbound-trust axis is meaningless and is
always set to `'n/a'`. Surfaced as a frozen constant so consumers
can introspect the contract without re-implementing the rule.

## Stable
