[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runSecretsRekey

# Function: runSecretsRekey()

```ts
function runSecretsRekey(options): Promise<{
  ok: boolean;
  unsupported?: true;
}>;
```

Defined in: packages/cli/src/commands/secrets.ts:328

**`Stable`**

`graphorin secrets rekey` - re-encrypt the whole encrypted-file
bundle under a new passphrase (fresh KDF salt and nonce; values
unchanged). Complements the per-value `secrets rotate`: rotate
replaces a protected VALUE, rekey replaces the KEY protecting the
bundle - mirroring `storage rekey` (database passphrase) and
`token rekey` (pepper compromise).

Only the `encrypted-file` source has a bundle passphrase; for every
other store (keyring, env, memory) the command exits `UNSUPPORTED`
(2). The CURRENT passphrase comes from normal store activation
(`GRAPHORIN_MASTER_PASSPHRASE`); the NEW one arrives as a SecretRef
URI so raw key material never lands on argv.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`SecretsRekeyOptions`](/api/@graphorin/cli/interfaces/SecretsRekeyOptions.md) |

## Returns

`Promise`\<\{
  `ok`: `boolean`;
  `unsupported?`: `true`;
\}\>
