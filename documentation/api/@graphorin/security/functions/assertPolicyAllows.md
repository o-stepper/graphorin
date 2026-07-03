[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / assertPolicyAllows

# Function: assertPolicyAllows()

```ts
function assertPolicyAllows(packageName, policy): void;
```

Defined in: packages/security/src/supply-chain/policy.ts:117

Throw [SkillInstallDeniedError](/api/@graphorin/security/classes/SkillInstallDeniedError.md) when the policy resolves to
`'deny'`. Returns silently otherwise so callers can chain it
inside a wider install pipeline.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `packageName` | `string` |
| `policy` | [`SupplyChainPolicy`](/api/@graphorin/security/interfaces/SupplyChainPolicy.md) |

## Returns

`void`

## Stable
