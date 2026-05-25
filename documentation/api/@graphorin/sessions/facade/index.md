[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/sessions](/api/@graphorin/sessions/index.md) / facade

# facade

`createSessionManager(...)` and the `Session` facade — the hybrid
facade-with-state surface for the sessions module. Per the
single-source-of-truth principle, this package OWNS sessions /
agents / handoffs / workflow attachments / audit metadata, and
DELEGATES message CRUD to `@graphorin/memory.session`. There is no
duplicate `session_messages` table, no separate FTS index, and no
message cache in this package.

## Interfaces

| Interface | Description |
| ------ | ------ |
| [AssistantMessage](/api/@graphorin/sessions/facade/interfaces/AssistantMessage.md) | - |
| [CreateSessionManagerOptions](/api/@graphorin/sessions/facade/interfaces/CreateSessionManagerOptions.md) | Per-session-manager configuration. |
| [Session](/api/@graphorin/sessions/facade/interfaces/Session.md) | Per-session ergonomic facade returned by [SessionManager.create](/api/@graphorin/sessions/facade/interfaces/SessionManager.md#create) / [SessionManager.get](/api/@graphorin/sessions/facade/interfaces/SessionManager.md#get). |
| [SessionCounters](/api/@graphorin/sessions/facade/interfaces/SessionCounters.md) | Counter receiver used by the commentary sanitizer + the cassette audit emissions. Defaults to a no-op. Hook your `@graphorin/observability` meter into this when wiring the session manager into a server. |
| [SessionExportOptions](/api/@graphorin/sessions/facade/interfaces/SessionExportOptions.md) | Options threaded into `Session.export({...})`. |
| [SessionManager](/api/@graphorin/sessions/facade/interfaces/SessionManager.md) | Surface returned by [createSessionManager](/api/@graphorin/sessions/facade/functions/createSessionManager.md). |
| [SessionMemoryFacade](/api/@graphorin/sessions/facade/interfaces/SessionMemoryFacade.md) | Subset of the `Memory.session` surface this package consumes. Kept structural so callers can pass either the `Memory` facade from `@graphorin/memory` or any custom shim with the same shape. |
| [SessionRecordCassetteOptions](/api/@graphorin/sessions/facade/interfaces/SessionRecordCassetteOptions.md) | Options accepted by `Session.recordToolCassette({...})`. |
| [SystemMessage](/api/@graphorin/sessions/facade/interfaces/SystemMessage.md) | - |
| [ToolMessage](/api/@graphorin/sessions/facade/interfaces/ToolMessage.md) | - |
| [UserMessage](/api/@graphorin/sessions/facade/interfaces/UserMessage.md) | - |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [MessageContent](/api/@graphorin/sessions/facade/type-aliases/MessageContent.md) | A single multimodal content part attached to a chat-style message. |

## Functions

| Function | Description |
| ------ | ------ |
| [createSessionManager](/api/@graphorin/sessions/facade/functions/createSessionManager.md) | Build a session manager. The manager is the public entry point; sessions are obtained via `manager.create(...)` / `manager.get(...)`. |
