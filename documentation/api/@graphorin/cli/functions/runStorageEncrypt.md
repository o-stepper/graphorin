[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/cli](/api/@graphorin/cli/index.md) / [](/api/@graphorin/cli/README.md) / runStorageEncrypt

# Function: runStorageEncrypt()

```ts
function runStorageEncrypt(options): Promise<StorageEncryptResult>;
```

Defined in: [packages/cli/src/commands/storage.ts:354](https://github.com/o-stepper/graphorin/blob/main/packages/cli/src/commands/storage.ts#L354)

`graphorin storage encrypt --passphrase-from <ref>` - encrypt a
previously unencrypted SQLite store. Delegates to the optional Phase
16 sub-pack `@graphorin/store-sqlite-encrypted` once installed; when
the sub-pack is missing the CLI exits `2` (`UNSUPPORTED`) with an
actionable hint.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`StorageEncryptOptions`](/api/@graphorin/cli/interfaces/StorageEncryptOptions.md) |

## Returns

`Promise`\&lt;`StorageEncryptResult`\&gt;

## Stable
