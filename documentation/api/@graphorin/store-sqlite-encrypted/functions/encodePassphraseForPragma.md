[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/store-sqlite-encrypted](/api/@graphorin/store-sqlite-encrypted/index.md) / [](/api/@graphorin/store-sqlite-encrypted/README.md) / encodePassphraseForPragma

# Function: encodePassphraseForPragma()

```ts
function encodePassphraseForPragma(value): string;
```

Defined in: packages/store-sqlite-encrypted/src/cipher-config.ts:69

**`Stable`**

SQL-literal-encodes a passphrase for use as the right-hand side of
`PRAGMA key = ...`.

- String input is wrapped in single quotes with internal `'` doubled
  per the SQL specification.
- Buffer input is encoded as the cipher peer's `x'<hex>'` blob form
  so binary keys round-trip exactly.

Empty inputs are rejected at this layer so callers cannot
accidentally open an unencrypted DB with an empty key.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `string` \| `Buffer`\&lt;`ArrayBufferLike`\&gt; |

## Returns

`string`
