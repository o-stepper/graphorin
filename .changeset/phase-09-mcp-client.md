---
'@graphorin/mcp': minor
---

Phase 09 — Model Context Protocol client. The new `@graphorin/mcp`
package joins the Graphorin framework on top of the foundations
from Phase 02 (`@graphorin/core`), Phase 03
(`@graphorin/security`), Phase 04 (`@graphorin/observability`),
and Phase 07 (`@graphorin/tools`). After this phase the agent
runtime, the standalone server, the CLI, and any consumer
codebase has a typed entry point for connecting to MCP servers
over stdio, Streamable HTTP, or the deprecated SSE transport,
plus the `toTools()` adapter that bridges MCP tool descriptors
into the strategy-aware Graphorin tool registry.

`@graphorin/mcp` ships:

- **Typed `MCPClient` factory.** `createMCPClient({ transport,
  collisionStrategy?, priority?, eventStore?, authProvider?,
  bearerToken?, clientName?, clientVersion?, logger? })` opens a
  typed connection over the supplied transport. The returned
  client exposes `listTools` / `listResources` / `listPrompts` /
  `callTool` / `readResource` / `getPrompt` / `close` plus the
  strategy-aware `toTools(...)` adapter. Every call accepts an
  `AbortSignal` and surfaces typed errors instead of raw `Error`.
- **Three transports.** `'stdio'` for local child-process MCP
  servers, `'streamable-http'` for the current spec-recommended
  HTTP transport with optional Streamable HTTP session support,
  and `'sse'` for back-compat with servers that have not migrated
  yet (the runtime emits one WARN-per-process on selection).
- **`toTools()` adapter.** Bridges every MCP tool descriptor into
  a typed Graphorin `Tool`. Honours the per-call `namespace`,
  `filter`, `inboundSanitization`, `defer_loading`,
  `deferLoadingThreshold`, `maxResultTokens`, `truncationStrategy`,
  `collisionStrategy`, `priority`, `sideEffectClassByTool`, and
  `preferredModelByTool` options; pins the `'mcp-derived'` trust
  class on every produced tool so the agent runtime's per-step
  preamble fires regardless of body-level overrides.
- **Strict default for MCP-derived tools.** Each produced `Tool`
  defaults to the `'detect-and-strip-and-wrap'` inbound
  prompt-injection sanitization policy applied at execution time
  on the result body and the `'detect-and-strip'` variant applied
  at registration time on the tool description (the wrap envelope
  is reserved for tool-result bodies inside the conversation
  history). Per-server `inboundSanitization: 'pass-through'`
  override is supported as the documented escape hatch.
- **Auto-deferral at the 10-tool threshold.** When the MCP
  server's `listTools()` returns more than `deferLoadingThreshold`
  entries (default `10`), the per-server default flips
  `defer_loading: true` for every produced tool; an INFO-log
  records the threshold value and the affected tool names; the
  `tool.retrieval.deferred.total{source='mcp-server-default'}`
  counter is incremented per affected tool. Operator overrides
  (`defer_loading: true | false`) always win.
- **Structured-content + outputSchema round-trip.** When the MCP
  server advertises an `outputSchema` on a tool definition (per
  the current MCP spec) and returns `structuredContent` on
  `callTool`, the adapter validates the structured form against a
  lightweight Graphorin-native JSON-Schema validator that
  conforms to the `ZodLikeSchema` contract from
  `@graphorin/core`, surfaces it as the typed `Tool.execute(...)`
  output, and preserves the unstructured `content[]` (including
  the backward-compatible `TextContent` mirror) in
  `ToolReturn.contentParts`. Pre-spec servers that emit only
  `content[]` fall through to the legacy concatenated-text
  behaviour bytes-equal. The
  `mcp.structured-content.emitted.total{server,tool}` counter
  increments per round-trip; the
  `mcp.structured-content.validation.failure.total{server,tool}`
  counter increments per validation failure.
- **Collision strategy + per-server priority.** Per-client
  `createMCPClient({ collisionStrategy, priority })` defaults
  flow through to the per-call `MCPClient.toTools({...})` and the
  strategy-aware `ToolRegistry.assertNoDuplicates(strategy, ctx)`
  overload from `@graphorin/tools`. Default strategy is
  `'auto-prefix'`; the rename uses the sanitised
  `serverIdentity` derived from the transport configuration. The
  `serverIdentity` discriminated union (one of `'mcp-stdio'`,
  `'mcp-streamable-http'`, `'mcp-sse'`) carries the
  disambiguation fields (stdio: `argsHash`; HTTP / SSE:
  `urlHostname` + `urlPath`); full URLs and full argv are NOT
  carried so transport secrets cannot leak.
- **Pluggable `EventStore`.** The `EventStore` interface fronts
  the Streamable HTTP `Mcp-Session-Id` + `Last-Event-ID` resume
  handshake. The default `InMemoryEventStore` keeps a per-session
  ring buffer (`capacity: 1024` default; configurable per
  instance); pluggable adapters (a SQLite-backed store from
  `@graphorin/store-sqlite` for cross-restart durability) follow
  the same interface.
- **OAuth integration.** `createOAuthAuthorizationProvider({
  serverId, storage, refreshAheadMs?, signal? })` wraps the
  existing `refreshOAuthSession(...)` helper from
  `@graphorin/security/oauth`, resolves the bearer header on every
  request, debounces concurrent refreshes via the OAuth
  subsystem's in-flight de-duplication, and emits the
  `mcp.auth.expired` lifecycle event when a refresh fails. The
  thin wrappers `mcpAuthLogin`, `mcpAuthListSessions`,
  `mcpAuthRefresh`, `mcpAuthRevoke`, and `mcpAuthStatus` are the
  surface the upcoming `graphorin auth` CLI binaries (Phase 15)
  consume.
- **Helpers.** `formatMCPServerName(transport)` renders the
  operator-facing single-line label used in audit rows + trace
  attributes; `validateMCPServerConfig({ transport, resumable? })`
  catches the most common configuration mistakes (missing url,
  unsupported scheme, `resumable: true` on `'stdio'` / `'sse'`)
  before the network-level handshake runs.
- **Typed errors.** `GraphorinMCPError` (abstract base) +
  concrete subclasses `MCPConnectionError`, `MCPProtocolError`,
  `MCPAuthError`, `MCPToolNotFoundError`, `MCPCallTimeoutError`
  (variants `'call-timeout'` + `'session-lost'`),
  `MCPCancelledError`, `MCPInvalidConfigError`, and
  `MCPTransportNotSupportedError` (variants
  `'transport-not-supported'` +
  `'transport-resumable-not-supported'`). Every error carries a
  stable lowercase `kind` discriminator, an actionable `hint`
  field where applicable, and a sanitized `metadata` bag the
  audit emitter persists alongside the standard context.
- **Reverse-proxy operational note.** The package README
  documents the canonical nginx + AWS ALB + Cloudflare + GCP LB
  configuration that prevents response buffering on the
  Streamable HTTP streaming response (without it the streaming
  events never reach the client until the proxy buffer is full).
- **Lightweight JSON-Schema validator.** `buildJsonSchemaValidator(...)`
  produces a `ZodLikeSchema`-compatible validator from a JSON
  Schema document. The validator avoids the `eval()` /
  `new Function(...)` paths the popular code-generation
  approaches require, supports the canonical subset of JSON
  Schema the MCP spec uses (`object`, `array`, `string`,
  `number`, `integer`, `boolean`, `null`, `enum`, `const`,
  `oneOf`, `anyOf`, `allOf`), and keeps the wire surface free of
  the generated-code attack surface.

`pnpm test` — 109 new tests across the `@graphorin/mcp` package
covering: every typed error class; the `validateMCPServerConfig`
matrix; the `deriveServerIdentity` discriminator branches; the
`InMemoryEventStore` ring-buffer semantics + replay + eviction
counter; the `toTools()` adapter (per-server namespace / filter /
inboundSanitization / `pass-through` WARN-once-per-server +
non-silenceable counter / defer_loading auto-default +
explicit-true + explicit-false branches with the source-tagged
INFO log + per-tool `tool.retrieval.deferred.total` /
`tool.retrieval.eager.total` counters per tool /
`deferLoadingThreshold` overrides / structured-content +
outputSchema round-trip on dual-emission + structured-only
fixtures / per-server `maxResultTokens` + `truncationStrategy` /
per-tool `sideEffectClassByTool` + `preferredModelByTool`
overrides / attacker-supplied tool description sanitization);
`MCPClient` integration paths (`listTools`, `callTool`,
`listResources`, `readResource`, `listPrompts`, `getPrompt`,
`close` idempotence, deprecated SSE WARN-once-per-process via the
`_resetSseWarnDedupForTesting` seam, resumable resolution INFO
log, AbortSignal cancellation propagation in less than 200 ms);
the trust-class + registry integration (every produced tool
normalises to `__trustClass = 'mcp-derived'` + `__source.kind =
'mcp'`; per-server `'pass-through'` keeps the trust class intact);
the registry collision-strategy ladder
(`ToolRegistry.assertNoDuplicates('auto-prefix' | 'priority' |
'manual', ctx)` integration; first-party precedence over
MCP-derived collisions); the OAuth bridge (missing-record path +
refresh-failure + `mcp.auth.expired` lifecycle event); property-
based round-trips for `adaptCallResult` and
`buildJsonSchemaValidator`; a snapshot test for the README
operational reverse-proxy snippets (canonical nginx +
analogous notes for AWS ALB / Cloudflare / GCP Load Balancer).
The integration tests use the SDK's
`InMemoryTransport.createLinkedPair()` + a configurable
in-process `Server` fixture so no child processes are spawned and
no network round-trips happen during the test run. Workspace-
wide: 1737 tests pass across 20 packages with no failures
(`pnpm run check-no-network: PASS`).
