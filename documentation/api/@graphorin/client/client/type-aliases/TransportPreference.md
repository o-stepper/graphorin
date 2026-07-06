[**Graphorin API reference v0.6.1**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/client](/api/@graphorin/client/index.md) / [client](/api/@graphorin/client/client/index.md) / TransportPreference

# Type Alias: TransportPreference

```ts
type TransportPreference = 
  | TransportKind
  | "auto";
```

Defined in: [packages/client/src/graphorin-client.ts:92](https://github.com/o-stepper/graphorin/blob/main/packages/client/src/graphorin-client.ts#L92)

Transport selector. `'auto'` (default) attempts a WebSocket
handshake first and falls back to SSE on failure.

## Stable
