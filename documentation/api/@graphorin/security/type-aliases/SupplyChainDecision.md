[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SupplyChainDecision

# Type Alias: SupplyChainDecision

```ts
type SupplyChainDecision = 
  | {
  outcome: "allow";
}
  | {
  outcome: "deny";
  reason: string;
  source: "denylist" | "framework-denylist";
};
```

Defined in: [packages/security/src/supply-chain/types.ts:149](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L149)

Decision returned by [evaluateSupplyChainPolicy](/api/@graphorin/security/functions/evaluateSupplyChainPolicy.md).

## Stable
