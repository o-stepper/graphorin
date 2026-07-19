[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / createInMemoryOAuthServerStore

# Function: createInMemoryOAuthServerStore()

```ts
function createInMemoryOAuthServerStore(): OAuthServerStore;
```

Defined in: packages/security/src/oauth/in-memory-store.ts:20

**`Stable`**

Create a new in-memory OAuth server store. Records are kept in
insertion order so `list()` returns deterministic snapshots.

## Returns

[`OAuthServerStore`](/api/@graphorin/core/interfaces/OAuthServerStore.md)
