[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ENCRYPTED\_FILE\_MAGIC

# Variable: ENCRYPTED\_FILE\_MAGIC

```ts
const ENCRYPTED_FILE_MAGIC: 16777216 = 0x01_00_00_00;
```

Defined in: packages/security/src/secrets/resolvers/encrypted-file.ts:34

On-disk format of an encrypted bundle:

```text
[4 bytes] magic version (0x01000000 little-endian)
[16 bytes] Argon2id salt (random per bundle)
[12 bytes] AES-256-GCM nonce (random per bundle)
[N bytes]  AES-256-GCM ciphertext
[16 bytes] AES-256-GCM authentication tag
```

The ciphertext, once decrypted, is UTF-8 JSON of the shape
`{ values: Record<string, string>, meta: { createdAt: string } }`.

The bundle is read end-to-end, decrypted with the passphrase derived
via Argon2id, and the requested fragment (`#field`) is selected from
the values map. JSON-pointer style fragments (`#/path/to/field`) are
supported for nested objects (post-MVP).

## Stable
