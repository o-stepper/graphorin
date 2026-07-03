[**Graphorin API reference v0.5.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuditChainVerifyResult

# Type Alias: AuditChainVerifyResult

```ts
type AuditChainVerifyResult = 
  | {
  count: number;
  ok: true;
}
  | {
  actual: string;
  brokenAt: number;
  expected: string;
  ok: false;
};
```

Defined in: packages/security/src/audit/types.ts:142

Result of `verifyAuditChain(...)`. Walks the chain from `from` to
`to` and returns either `{ ok: true, count }` or
`{ ok: false, brokenAt, expected, actual }`.

## Stable
