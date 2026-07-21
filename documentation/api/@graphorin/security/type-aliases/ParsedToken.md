[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / ParsedToken

# Type Alias: ParsedToken

```ts
type ParsedToken = 
  | {
  checksum: string;
  entropy: string;
  env: string;
  ok: true;
  prefix: string;
  raw: string;
  version: typeof TOKEN_VERSION;
}
  | {
  ok: false;
  reason: TokenFormatError;
};
```

Defined in: packages/security/src/auth/token-format.ts:80

**`Stable`**

Result of `parseToken(...)`. Splitting the parsed shape lets the
caller branch on the discriminated `ok` field without exception
plumbing on the verify hot path.
