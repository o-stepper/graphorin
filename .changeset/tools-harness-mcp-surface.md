---
'@graphorin/mcp': minor
'@graphorin/agent': minor
---

WI-13 — MCP surface completion: elicitation, sampling, and `resource_link` (P2-2, opt-in).

Maps the remaining MCP client-side primitives onto Graphorin's existing ones, after first decomposing the `to-tools.ts` adapter (F-MCP-001).

**F-MCP-001 — decomposition (behavior-preserving).** `packages/mcp/src/client/to-tools.ts` is split into focused modules — `defer-loading.ts` (auto/explicit deferral resolution + counters + INFO log), `inbound-filters.ts` (inbound policy + pass-through WARN + description strip), and `adapt-result.ts` (`CallToolResult` → `ToolReturn`). `to-tools.ts` stays the orchestrator and re-exports `adaptCallResult` / `DEFAULT_DEFER_LOADING_THRESHOLD` / `_resetMcpAdapterDedupForTesting` so existing import paths are unchanged.

**`resource_link` → result handles (ties to WI-10 / P1-4).** Adds `resource_link` to `MCPContentPart`. A `resource_link` tool result is no longer inlined: the adapter surfaces a compact preview plus the resource `uri` as a result handle. New `createMcpResourceReader({ clients })` (`@graphorin/mcp/client`) implements the `@graphorin/tools` `ResultReader` and resolves such a handle on demand via `readResource(uri)` (with client-side byte/line ranging), trying each client until one server resolves it.

**Elicitation (`elicitation/create`) and sampling (`sampling/createMessage`).** New opt-in callbacks on `createMCPClient`: `elicitation?` (back it with a HITL surface) and `sampling?` (back it with a `Provider`). Both are **gated** — the client advertises the matching capability and registers the request handler only when the callback is supplied, so the default client advertises neither (no implicit prompting, no implicit model calls; R4). The public surface speaks Graphorin-typed boundaries (`MCPElicitationRequest`/`MCPElicitationResult`, `MCPSamplingRequest`/`MCPSamplingResult`); SDK schemas stay internal. Counters: `mcp.elicitation.requested|accepted|declined.total`, `mcp.sampling.requested|completed.total`, `mcp.resource-link.emitted|resolved.total`.

**Agent wiring.** New opt-in `AgentConfig.resultReaders?: ReadonlyArray<ResultReader>` — composed after the built-in spill-file reader (tried in order; each rejects handles it does not own), and force-registering `read_result` when present. Wire `createMcpResourceReader(...)` here so the agent resolves an MCP `resource_link` end-to-end via `read_result`.

Scoped honestly: elicitation resolves **in-process** while the `callTool` JSON-RPC request is in flight (it does not durably suspend a run — durable-suspend elicitation is a follow-up); sampling redaction/sensitivity is the operator `Provider`'s responsibility (request messages are MCP-derived/untrusted). Docs updated in `documentation/guide/mcp-client.md`, `tools.md`, and `agent-runtime.md`.
