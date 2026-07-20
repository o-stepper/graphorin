[**Graphorin API reference v0.13.8**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [client](/api/@graphorin/client/client/index.md) / TransportPreference

# Type Alias: TransportPreference

```ts
type TransportPreference = 
  | TransportKind
  | "auto";
```

Defined in: packages/client/src/graphorin-client.ts:106

**`Stable`**

Transport selector. `'auto'` (default) attempts a WebSocket
handshake first and falls back to SSE on failure.
