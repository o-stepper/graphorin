[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / KEYRING\_DEFAULT\_SERVICE

# Variable: KEYRING\_DEFAULT\_SERVICE

```ts
const KEYRING_DEFAULT_SERVICE: "graphorin" = 'graphorin';
```

Defined in: packages/security/src/secrets/resolvers/keyring.ts:16

**`Stable`**

Service prefix used for every keyring entry written by the framework.
Picking a stable prefix makes it possible for users to inspect the
OS keychain (Keychain Access on macOS, Credential Manager on
Windows, `seahorse` / `gnome-keyring` on Linux) and easily filter
Graphorin-owned credentials.
