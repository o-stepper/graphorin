[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/mcp](/api/@graphorin/mcp/index.md) / errors

# errors

Typed error union for the `@graphorin/mcp` package.

Every error carries a stable lowercase [MCPErrorKind](/api/@graphorin/mcp/errors/type-aliases/MCPErrorKind.md)
discriminator, an actionable MCPError.hint field where
applicable, and an optional structured `metadata` bag the audit
emitter persists alongside the standard `runId` / `sessionId`
context.

## Classes

| Class | Description |
| ------ | ------ |
| [GraphorinMCPError](/api/@graphorin/mcp/errors/classes/GraphorinMCPError.md) | Base class for every typed error produced by `@graphorin/mcp`. |
| [MCPAuthError](/api/@graphorin/mcp/errors/classes/MCPAuthError.md) | Raised when an authentication / authorization step fails. |
| [MCPCallTimeoutError](/api/@graphorin/mcp/errors/classes/MCPCallTimeoutError.md) | Raised when a tool call exceeds its configured timeout / aborts. |
| [MCPCancelledError](/api/@graphorin/mcp/errors/classes/MCPCancelledError.md) | Raised when an in-flight call is cancelled by an `AbortSignal`. |
| [MCPConnectionError](/api/@graphorin/mcp/errors/classes/MCPConnectionError.md) | Raised when a transport fails to connect or is dropped unexpectedly. |
| [MCPInvalidConfigError](/api/@graphorin/mcp/errors/classes/MCPInvalidConfigError.md) | Raised on invalid `createMCPClient(...)` configuration. |
| [MCPProtocolError](/api/@graphorin/mcp/errors/classes/MCPProtocolError.md) | Raised on JSON-RPC / MCP protocol-level errors. |
| [MCPToolNotFoundError](/api/@graphorin/mcp/errors/classes/MCPToolNotFoundError.md) | Raised when MCPClient.callTool is invoked for an unknown tool. |
| [MCPTransportNotSupportedError](/api/@graphorin/mcp/errors/classes/MCPTransportNotSupportedError.md) | Raised when an operator requests a transport / capability that the runtime does not support (e.g. `resumable: true` on `stdio`). |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [MCPErrorMetadata](/api/@graphorin/mcp/errors/interfaces/MCPErrorMetadata.md) | Common metadata bag attached to every MCPError. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [MCPErrorKind](/api/@graphorin/mcp/errors/type-aliases/MCPErrorKind.md) | Discriminator union for every error class produced by `@graphorin/mcp`. New kinds extend this union; never throw plain `Error` from framework code. |
