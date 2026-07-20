[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / \_setFrameworkDenylistForTesting

# Function: \_setFrameworkDenylistForTesting()

```ts
function _setFrameworkDenylistForTesting(patterns): void;
```

Defined in: packages/security/src/supply-chain/policy.ts:44

**`Experimental`**

Override the framework-maintained denylist. The MVP keeps this
dormant - only the operator-managed denylist is consulted unless
tests inject patterns here.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `patterns` | readonly `string`[] |

## Returns

`void`
