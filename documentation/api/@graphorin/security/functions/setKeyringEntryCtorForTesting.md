[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / \_setKeyringEntryCtorForTesting

# Function: \_setKeyringEntryCtorForTesting()

```ts
function _setKeyringEntryCtorForTesting(ctor): void;
```

Defined in: packages/security/src/secrets/resolvers/keyring.ts:73

**`Experimental`**

Test-only override that lets fixtures inject a stub keyring instead
of taking a hard dependency on `@napi-rs/keyring` in the unit tests.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `ctor` | `KeyringEntryCtor` \| `null` |

## Returns

`void`
