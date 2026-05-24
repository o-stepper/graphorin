---
'@graphorin/agent': minor
---

Build the unified `ToolRegistry` at `createAgent(...)` warm-up (WI-02),
giving `@graphorin/tools`' `createToolRegistry(...)` its first production
call-site. This realises Principle #12 — one registry across every tool
source, with deterministic cross-source name-collision resolution.

- **New helper `buildToolRegistry(...)`** (`src/tooling/registry-build.ts`,
  internal) assembles a registry from `config.tools` + `config.skills`:
  - First-party tools register as `first-party-user-defined`. An explicit,
    well-formed `__source` stamp on a tool is honoured if present (so
    re-registered `ResolvedTool`s keep their provenance).
  - Inline skill tools are stamped via `@graphorin/skills`' `stampSkillTool(...)`
    and register with their `skill` source / derived trust class. The
    agent's loose `SkillsRegistryLike` entries are validated structurally
    before stamping; non-conforming entries are skipped.
  - Collisions resolve with the `auto-prefix` strategy (first-party wins
    un-prefixed; losers are namespaced, e.g. `linear.search`). Resolutions
    are emitted on the tool audit bus.
- **New read-only `agent.registry`** exposes the assembled registry for
  inspection; the run loop and `tool_search` consume it in follow-up work.

Behaviour note: because the registry is the tool-validation authority, a
malformed tool (invalid `examples` / `preferredModel` / `sideEffectClass`)
now fails fast at `createAgent(...)` rather than later.

Fidelity notes (verified against source): MCP tools from `adaptMCPTools(...)`
are **not** auto-stamped with `__source`/`__trustClass` — those are assigned
by the registry at registration time — so MCP tools entering via
`config.tools` register as first-party unless a source is supplied (their
baked-in `sandboxPolicy`/`inboundSanitization` are preserved regardless); a
dedicated `mcp` config hook is deferred. Semantic-search `embedder` /
`semanticScoreThreshold` are accepted and passed through but not yet wired.
