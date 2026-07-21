[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/secret-1password](/api/@graphorin/secret-1password/index.md) / [](/api/@graphorin/secret-1password/README.md) / OpCliErrorKind

# Type Alias: OpCliErrorKind

```ts
type OpCliErrorKind = 
  | "binary-missing"
  | "signed-out"
  | "reference-not-found"
  | "timeout"
  | "unknown";
```

Defined in: packages/secret-1password/src/op-cli.ts:101

**`Stable`**

`signed-out` covers every operator-fixable auth state: not signed
in, an expired session, and (op CLI 2.35+) `no accounts configured`
- the error's `hint` distinguishes the setup path.
