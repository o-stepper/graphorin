[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / cipherIntegrityCheck

# Function: cipherIntegrityCheck()

```ts
function cipherIntegrityCheck(conn): CipherIntegrityCheckResult;
```

Defined in: [packages/store-sqlite-encrypted/src/integrity-check.ts:40](https://github.com/o-stepper/graphorin/blob/main/packages/store-sqlite-encrypted/src/integrity-check.ts#L40)

Runs `PRAGMA integrity_check` against the provided connection. The
connection MUST already be open with the cipher key applied
(typically via [createEncryptedConnection](/api/@graphorin/store-sqlite-encrypted/functions/createEncryptedConnection.md)) - a wrong key
surfaces as an open/read error before the pragma runs.

The pragma is read-only so it is safe to run from a triggers daemon
cron without taking a write lock.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `conn` | [`SqliteConnection`](/api/@graphorin/store-sqlite/connection/interfaces/SqliteConnection.md) |

## Returns

[`CipherIntegrityCheckResult`](/api/@graphorin/store-sqlite-encrypted/interfaces/CipherIntegrityCheckResult.md)

## Stable
