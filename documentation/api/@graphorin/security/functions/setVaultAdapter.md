[**Graphorin API reference v0.10.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / setVaultAdapter

# Function: setVaultAdapter()

```ts
function setVaultAdapter(adapter): void;
```

Defined in: [packages/security/src/secrets/resolvers/vault.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/secrets/resolvers/vault.ts#L31)

Register a runtime adapter for the `vault://` scheme. Calling this
twice replaces the previous adapter - matching the documented
"last registration wins" contract.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `adapter` | \| [`VaultAdapter`](/api/@graphorin/security/type-aliases/VaultAdapter.md) \| `undefined` |

## Returns

`void`

## Stable
