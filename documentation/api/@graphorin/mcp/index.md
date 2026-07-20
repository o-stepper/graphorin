[**Graphorin API reference v0.13.7**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/mcp

# @graphorin/mcp

> Model Context Protocol client for the Graphorin framework.

`@graphorin/mcp` ships the typed MCP client used by Graphorin
agents, the standalone server, and the CLI. The package wraps the
official `@modelcontextprotocol/sdk@^1.29.0` client primitives and
adds the Graphorin-specific glue: the `toTools()` adapter that
bridges MCP tool descriptors into the typed Graphorin tool
registry, the inbound prompt-injection sanitization defaults for
MCP-derived tools, the structured-content + outputSchema
round-trip with backward-compatible TextContent mirror, the
deferred-loading auto-default at the 10-tool threshold, the
collision-strategy + per-server priority handoff to the tool
registry, honest Streamable HTTP session semantics, and the OAuth
bridge that resolves bearer headers from
the existing outbound OAuth subsystem in `@graphorin/security`.

## Highlights

- **Three transports out of the box.** `'stdio'` is the primary
  transport for local MCP servers started as a child process;
  `'streamable-http'` is the current default for remote servers
  with optional Streamable HTTP session support; `'sse'` is the
  deprecated legacy transport, kept for back-compat with servers
  that have not migrated yet (the runtime emits one WARN per
  process on selection).
- **Typed `MCPClient` surface.** `listTools` / `listResources` /
  `listPrompts` / `callTool` / `readResource` /
  `readResourceContents` (multi-content resources) / `getPrompt` /
  `close` plus the strategy-aware `toTools(...)` adapter.
- **Tool pinning (TOFU rug-pull defense).** `toTools({ pinStore })`
  records a fingerprint of each tool's name / description / schema on
  first use and, when a pin store is present, **rejects** silent drift
  by default (`onPinMismatch: 'warn'` downgrades to a warning);
  description-injection heuristics at registration feed the
  `mcp.tool-description.injection-flagged.total` counter. The full pin
  lifecycle: tools ADDED after the first recording are rejected
  by default too (`mcp.tools.pin-added.total` under `'warn'`), removals
  are observable (`mcp.tools.pin-removed.total`, never an exception),
  and `onPinMismatch: 'accept-and-update'` is the explicit operator
  path to re-trust a legitimately changed catalogue - it rewrites the
  store with the current snapshot (`mcp.tools.pins-updated.total`) so
  subsequent calls are clean. Explicit `pinnedFingerprints` remain
  subset-pins and win over the store.
- **Strict default for MCP-derived tools.** Every `Tool` produced
  by `MCPClient.toTools()` defaults to the
  `'detect-and-strip-and-wrap'` inbound prompt-injection
  sanitization policy (mirrored on tool-result bodies at execution
  time) and the `'sandboxed'` sandbox policy. The trust class is
  pinned to `'mcp-derived'` so the agent runtime's per-step
  preamble fires regardless of body-level overrides.
- **Auto-deferral at the 10-tool threshold.** When the MCP
  server's `listTools()` returns more than `deferLoadingThreshold`
  entries (default `10`), the per-server default flips
  `defer_loading: true` for every produced tool; an INFO-log
  records the threshold and the tool names; the
  `tool.retrieval.deferred.total` counter is incremented per
  affected tool.
- **Structured-content round-trip.** When the MCP server
  advertises an `outputSchema` on a tool definition (per the
  current MCP spec) and returns `structuredContent` on `callTool`,
  the adapter validates the structured form against the converted
  Zod-compatible schema and surfaces it as the typed `Tool.execute`
  output. The unstructured `content[]` is preserved in
  `ToolReturn.contentParts` (including the backward-compatible
  `TextContent` mirror); pre-spec servers that emit only `content[]`
  fall through to the legacy concatenated-text behaviour.
- **Collision resolution at the registry boundary.** The client
  exposes `serverIdentity`, `collisionStrategy` (default
  `'auto-prefix'`), and the optional per-client `priority` field;
  the registry consumes the trio when its strategy-aware
  `assertNoDuplicates(strategy, ctx)` overload runs.
- **Transport-derived identity.** `serverIdentity.id` derives
  from the operator-controlled transport config (HTTP ids include a
  non-default port), never from the name a server self-reports on
  `initialize` - TOFU pins, `mcp:<id>:<uri>` handle scoping and taint
  labels all key off it, so a rug-pull rename cannot mint a fresh pin
  and a malicious server cannot claim a trusted server's scope. The
  self-reported name survives as display-only `reportedServerName`;
  the explicit `serverInfoName` option remains the operator override.
  Handle ids are percent-encoded (`:` is routine in ids now).
- **OAuth integration.** `createOAuthAuthorizationProvider({...})`
  wraps the existing `refreshOAuthSession(...)` helper from
  `@graphorin/security/oauth`, resolves the bearer header on every
  request, debounces concurrent refreshes via the OAuth
  subsystem's in-flight de-duplication, and emits the
  `mcp.auth.expired` lifecycle event when a refresh fails.
- **Streamable HTTP sessions.** The client persists the assigned
  `Mcp-Session-Id` and the SDK transport auto-reconnects with
  `Last-Event-ID` after a transient disconnect. Event replay is the
  SERVER's responsibility per the Streamable HTTP spec - the client
  surfaces `sessionIdPresent` (stateful routing detected; not a
  replay guarantee).

## Stable sub-paths

```ts
import { createMCPClient } from '@graphorin/mcp/client';
import { createOAuthAuthorizationProvider } from '@graphorin/mcp/oauth';
import {
  formatMCPServerName,
  validateMCPServerConfig,
} from '@graphorin/mcp/helpers';
import { MCPConnectionError, MCPProtocolError } from '@graphorin/mcp/errors';
import type {
  MCPTransportConfig,
  ServerIdentity,
} from '@graphorin/mcp/transport';
```

## Quick start

```ts
import { createMCPClient } from '@graphorin/mcp';

// Local MCP server over stdio.
const fileSystem = await createMCPClient({
  transport: {
    kind: 'stdio',
    command: 'pnpm',
    args: ['dlx', '@modelcontextprotocol/server-filesystem', '/Users/me/Documents'],
  },
});

// Remote MCP server over Streamable HTTP.
const issues = await createMCPClient({
  transport: {
    kind: 'streamable-http',
    url: 'https://issues.example.com/mcp',
    headers: { Authorization: 'Bearer ${TOKEN}' },
  },
});

const tools = [
  ...(await fileSystem.toTools({ namespace: 'fs' })),
  ...(await issues.toTools({ namespace: 'issues' })),
];

// `tools` is ready to register with `@graphorin/tools`'s
// `createToolRegistry({...})`; the agent runtime consumes the
// resulting registry as part of its per-step planner.

await fileSystem.close();
await issues.close();
```

## Inbound sanitization policy reference

The per-server `inboundSanitization` field controls how
imperative-pattern matches in tool result bodies (and tool
descriptions, at registration time) are handled:

| Policy                          | Description                                                                 |
|---------------------------------|-----------------------------------------------------------------------------|
| `'pass-through'`                | No scan; bytes-equal forwarding (use only for trusted in-house servers).    |
| `'detect-and-flag'`             | Scan; emit a flag span attribute + audit row but do not modify the body.    |
| `'detect-and-strip'`            | Replace each match with the `[REDACTED:imperative-pattern]` literal token.  |
| `'detect-and-wrap'`             | Wrap the body in `<<<untrusted_content>>>` without stripping matches.       |
| `'detect-and-strip-and-wrap'`   | **Default for MCP-derived tools.** Both strip matches and wrap the body.    |

Tool descriptions are always sanitized at registration time using
the `'detect-and-strip'` variant of the configured policy (the
wrap envelope is reserved for tool-result bodies inside the
conversation history; the description goes into the per-step tool
catalogue verbatim aside from the strip pass). The same strip pass
covers the ANNOTATION strings inside the tool's JSON Schemas
(`description`, `title`, `$comment`, string `examples` at any
nesting depth) before the schema reaches the provider wire and the
`tool_search` projection - the Invariant Labs tool-poisoning
hiding place. Semantic keywords (`enum`, `const`, `pattern`,
`required`, property names) are never modified, and the TOFU
fingerprint keeps hashing the RAW definition, so existing pins
survive and drift detection still sees the original bytes
(`mcp.tool-schema.injection-flagged.total` counts hits). The text
of an `isError` result goes through the full configured policy
(strip + envelope by default) before it reaches the model as a
tool error message.

## OAuth integration

The package re-exports the OAuth library functions as the
operator-facing CLI helpers `mcpAuthLogin`, `mcpAuthListSessions`,
`mcpAuthRefresh`, `mcpAuthRevoke`, and `mcpAuthStatus`. They wrap
the lower-level `loginInteractive`, `listOAuthSessions`,
`refreshOAuthSession`, `revokeOAuthSession`, and `getOAuthStatus`
helpers in `@graphorin/security/oauth`. The corresponding CLI
binaries land in Phase 15.

```ts
import {
  createInMemoryOAuthServerStore,
  loginInteractive,
} from '@graphorin/security/oauth';
import {
  createOAuthAuthorizationProvider,
  createMCPClient,
} from '@graphorin/mcp';

const storage = createInMemoryOAuthServerStore();
await loginInteractive({
  serverId: 'issues-mcp',
  serverUrl: 'https://issues.example.com/mcp',
  storage,
});

const authProvider = createOAuthAuthorizationProvider({
  serverId: 'issues-mcp',
  storage,
});

const issues = await createMCPClient({
  transport: {
    kind: 'streamable-http',
    url: 'https://issues.example.com/mcp',
  },
  // The client installs a per-request fetch-wrapper that calls
  // `authProvider.resolveHeader()` on every outgoing request, so the
  // refresh-ahead window fires automatically and a long-lived session
  // survives token expiry without re-creating the client. Do **not**
  // resolve the token once into static `headers` - that pins a single
  // token and defeats the refresh.
  authProvider,
});
```

For a rare pre-shared token, pass `bearerToken` instead (mutually
exclusive with `authProvider`; supplying both throws
`MCPInvalidConfigError`):

```ts
const issues = await createMCPClient({
  transport: { kind: 'streamable-http', url: 'https://issues.example.com/mcp' },
  bearerToken: process.env.ISSUES_MCP_TOKEN!,
});
```

## Managed client (auto-reconnect)

`createMCPClient` connections are deliberately **one-shot**: the SDK
heals transient Streamable HTTP hiccups itself (`Last-Event-ID`), but
a dead stdio child or a lost HTTP session kills the client for good -
and every `Tool` adapted from it closes over the corpse. For
long-running agents, opt into the managed wrapper:

```ts
import { createManagedMCPClient } from '@graphorin/mcp';

const client = await createManagedMCPClient({
  transport: { kind: 'stdio', command: 'linear-mcp' },
  reconnect: { maxAttempts: 5, initialDelayMs: 500, maxDelayMs: 30_000 },
});
const tools = await client.toTools({ pinStore }); // register once
```

The wrapper implements `MCPClient` by delegating to an inner client it
rebuilds on transport close (exponential backoff + jitter;
`mcp.reconnect.attempt/success/gave-up.total` counters). Tools from
`client.toTools()` close over the **wrapper**, so the same registered
`Tool` objects keep working across a reconnect - no re-registration.
After a successful reconnect the wrapper re-runs `toTools()` with the
last-used options, so the pin comparison / TOFU store re-screens the
post-reconnect catalogue (a rug-pull across a reconnect is caught and,
with a pin store, rejected + logged). Two contracts to know: an
**in-flight call is never retried** (the failed call stays failed;
retry policy belongs to the executor/model - only the connection
heals), and the operator's `onTransportClose` fires **once, on final
failure** (reconnect attempts exhausted), not per outage.

## Streamable HTTP sessions

When the MCP server assigns an `Mcp-Session-Id` on `initialize`, the
client persists it for stateful routing and exposes
`client.sessionIdPresent` (`client.resumable` is its deprecated
alias). A session id is **not** a replay guarantee: per the
Streamable HTTP spec, event replay is the **server's**
responsibility, and the SDK transport already auto-reconnects with
the `Last-Event-ID` header after a transient disconnect - no client
configuration needed. (The former client-side `eventStore` option
was removed: a client-held store cannot drive replay; passing the
legacy option logs a warning.)

### Reverse-proxy operational note

When a Graphorin client connects to a Streamable HTTP MCP server
through a reverse proxy (nginx, HAProxy, AWS ALB, Cloudflare, GCP
Load Balancer), the proxy MUST be configured to disable response
buffering on the SSE-style streaming response. Without the
directive the symptoms are:

- The client never receives `tool.execute.progress` /
  `tool.execute.partial` events until the tool completes (defeats
  the streaming purpose).
- The connection appears to hang from the client side until the
  proxy buffer is full.
- Intermediate keep-alive timeouts fire because the proxy thinks
  the connection is idle.

#### Canonical nginx snippet

```nginx
location /mcp {
  proxy_buffering off;
  proxy_cache off;
  chunked_transfer_encoding on;
  proxy_read_timeout 600s;
}
```

#### Analogous notes for other reverse proxies

- **AWS ALB.** Enable stickiness, raise the idle-timeout to at
  least 600 s, and confirm WebSocket-style upgrade compatibility
  is enabled.
- **Cloudflare.** Disable "Always Online" caching for the MCP
  route and raise the proxy timeout via Cloudflare Tunnel.
- **GCP Load Balancer.** Configure the backend service with
  `connectionDraining.drainingTimeoutSec >= 600` and
  `timeoutSec >= 600`.

## Errors

Every error class extends `GraphorinMCPError` and carries a
stable lowercase `kind` discriminator and an actionable `hint`
field where applicable:

- `MCPConnectionError`               - transport could not be established or was dropped.
- `MCPProtocolError`                 - JSON-RPC / MCP protocol-level error.
- `MCPAuthError`                     - authentication / authorization failure.
- `MCPToolNotFoundError`             - the requested tool is not registered with the server.
- `MCPCallTimeoutError`              - tool call exceeded the configured timeout (variant `'session-lost'` for the resume-handshake-lost path).
- `MCPCancelledError`                - call was cancelled by an `AbortSignal`.
- `MCPInvalidConfigError`            - the supplied `MCPTransportConfig` is invalid.
- `MCPTransportNotSupportedError`    - the supplied configuration requested an unsupported transport / capability combination (variant `'transport-resumable-not-supported'` for resumable sessions on `'stdio'` / `'sse'`).

## Acceptance & testing

- The package's unit + integration + property tests run under Vitest
  with no network calls (verified by the workspace
  `pnpm run check-no-network` script).
- Integration tests use the SDK's `InMemoryTransport` linked-pair
  + a configurable in-process `Server` fixture; no child
  processes are spawned and no network round-trips happen during
  the test run.
- Coverage thresholds: 80 % statements, 80 % lines, 80 %
  functions, 70 % branches.

## Dependencies

| Dependency                       | Pin              | Purpose                                       |
|----------------------------------|------------------|-----------------------------------------------|
| `@modelcontextprotocol/sdk`      | `^1.29.0`        | Underlying MCP client + transport primitives. |
| `@graphorin/core`                | workspace        | `Tool` / `MessageContent` / `ZodLikeSchema`.  |
| `@graphorin/security`            | workspace        | OAuth client + lifecycle event surface.       |
| `@graphorin/observability`       | workspace        | Imperative-pattern catalogue.                 |
| `@graphorin/tools`               | workspace        | Inbound sanitization helper + counter registry. |

## License

MIT - © 2026 Oleksiy Stepurenko.

---

**Project Graphorin** · v0.13.7 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/mcp/README.md) | `@graphorin/mcp` - Model Context Protocol client for the Graphorin framework. |
| [client](/api/@graphorin/mcp/client/index.md) | Public surface for the MCP client. |
| [errors](/api/@graphorin/mcp/errors/index.md) | Typed error union for the `@graphorin/mcp` package. |
| [helpers](/api/@graphorin/mcp/helpers/index.md) | Helper utilities exposed by `@graphorin/mcp`. |
| [oauth](/api/@graphorin/mcp/oauth/index.md) | OAuth integration surface for `@graphorin/mcp`. |
| [package.json](/api/@graphorin/mcp/package.json/index.md) | - |
| [transport](/api/@graphorin/mcp/transport/index.md) | Transport descriptors + identity helpers for `@graphorin/mcp`. |
