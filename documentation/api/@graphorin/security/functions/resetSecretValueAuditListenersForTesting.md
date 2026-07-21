[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / \_resetSecretValueAuditListenersForTesting

# Function: \_resetSecretValueAuditListenersForTesting()

```ts
function _resetSecretValueAuditListenersForTesting(): void;
```

Defined in: packages/security/src/secrets/secret-value.ts:78

**`Experimental`**

Resets the audit listener set. Tests use this to isolate fixtures;
production code never calls it.

## Returns

`void`
