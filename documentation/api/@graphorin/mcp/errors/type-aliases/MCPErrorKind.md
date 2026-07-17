[**Graphorin API reference v0.11.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / [errors](/api/@graphorin/mcp/errors/index.md) / MCPErrorKind

# Type Alias: MCPErrorKind

```ts
type MCPErrorKind = 
  | "connection-failed"
  | "protocol-error"
  | "auth-error"
  | "tool-not-found"
  | "tool-execution"
  | "pin-mismatch"
  | "call-timeout"
  | "cancelled"
  | "invalid-config"
  | "session-lost"
  | "transport-not-supported"
  | "transport-resumable-not-supported";
```

Defined in: [packages/mcp/src/errors/index.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/mcp/src/errors/index.ts#L20)

Discriminator union for every error class produced by
`@graphorin/mcp`. New kinds extend this union; never throw plain
`Error` from framework code.

## Stable
