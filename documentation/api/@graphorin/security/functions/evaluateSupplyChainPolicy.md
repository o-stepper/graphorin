[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / evaluateSupplyChainPolicy

# Function: evaluateSupplyChainPolicy()

```ts
function evaluateSupplyChainPolicy(packageName, policy?): SupplyChainDecision;
```

Defined in: packages/security/src/supply-chain/policy.ts:53

**`Stable`**

Evaluate the supply-chain policy for the supplied package name.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `packageName` | `string` |
| `policy` | [`SupplyChainPolicy`](/api/@graphorin/security/interfaces/SupplyChainPolicy.md) |

## Returns

[`SupplyChainDecision`](/api/@graphorin/security/type-aliases/SupplyChainDecision.md)
