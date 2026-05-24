[**Graphorin API reference v0.3.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [errors](/api/@graphorin/mcp/errors/index.md) / MCPErrorKind

# Type Alias: MCPErrorKind

```ts
type MCPErrorKind = 
  | "connection-failed"
  | "protocol-error"
  | "auth-error"
  | "tool-not-found"
  | "call-timeout"
  | "cancelled"
  | "invalid-config"
  | "session-lost"
  | "transport-not-supported"
  | "transport-resumable-not-supported";
```

Defined in: packages/mcp/src/errors/index.ts:20

Discriminator union for every error class produced by
`@graphorin/mcp`. New kinds extend this union; never throw plain
`Error` from framework code.

## Stable
