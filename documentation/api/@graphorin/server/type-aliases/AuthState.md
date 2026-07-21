[**Graphorin API reference v0.13.10**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / AuthState

# Type Alias: AuthState

```ts
type AuthState = 
  | {
  kind: "unauthenticated";
}
  | {
  grantedScopes: ReadonlyArray<ParsedScope>;
  kind: "token";
  token: VerifiedToken;
}
  | {
  grantedScopes: ReadonlyArray<ParsedScope>;
  kind: "anonymous";
};
```

Defined in: packages/server/src/internal/context.ts:16

**`Stable`**

Discriminator for the request authentication state.
