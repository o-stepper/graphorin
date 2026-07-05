# @graphorin/skills

## 0.6.1

### Patch Changes

- [#142](https://github.com/o-stepper/graphorin/pull/142) [`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430) Thanks [@o-stepper](https://github.com/o-stepper)! - Version constants and version-bearing strings now derive from each package's manifest at build time (`VERSION = pkg.version`; writer ids, client/server info, OTLP framework attributes, build-info metrics interpolate it). No behavioral change at the current version: the rendered strings are byte-identical. A release bump no longer edits source; the new `check-version-consistency` gate fails any reintroduced hardcoded framework version.

- Updated dependencies [[`436d6ca`](https://github.com/o-stepper/graphorin/commit/436d6ca5ebbd16df094e915682d3915c279a8430)]:
  - @graphorin/core@0.6.1
  - @graphorin/security@0.6.1
  - @graphorin/tools@0.6.1

## 0.6.0

### Patch Changes

- [#134](https://github.com/o-stepper/graphorin/pull/134) [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6) Thanks [@o-stepper](https://github.com/o-stepper)! - Cap self-declared skill trust for npm and git sources (mcp-skills-01). The RP-9 rule - trust is granted by the integrator, never the artifact - previously applied only to `folder` sources: an npm/git skill without an operator `trustLevel` took its SKILL.md's self-declared `graphorin-trust-level: trusted` verbatim, and because the signature trust root allows an inline key in the same SKILL.md, a malicious package could self-sign, declare trusted, and load unsandboxed. The cap now applies to every source kind; an explicit operator `trustLevel` on the source still wins.

- [#135](https://github.com/o-stepper/graphorin/pull/135) [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3) Thanks [@o-stepper](https://github.com/o-stepper)! - MCP correctness tail (audit 2026-07-04 Wave B, cluster B8).

  - mcp-skills-05: a `sampling/createMessage` carrying `tools` / `toolChoice` is rejected with an `McpError` (the 2025-11-25 MUST - the client does not declare `sampling.tools`; previously it silently answered as a plain completion). URL-mode elicitation is declined honestly instead of being surfaced as an empty form with the URL invisible.
  - mcp-skills-06: MCP resource handles are scoped to their originating server (`mcp:<serverId>:<uri>`); `createMcpResourceReader` consults ONLY the matching client, closing the cross-server confused-deputy hop where server A's link (or a prompt-injected model) fetched a resource from trusted server B. Bare URIs are refused unless `allowCrossServer: true` is opted in.
  - mcp-skills-07: server-supplied JSON-Schema `pattern`s are guarded before compilation - pattern/tested-string length caps plus a nested-quantifier heuristic (`(a+)+`-class) - so a malicious server can no longer stall the event loop with catastrophic backtracking; guarded-out patterns degrade to permissive like malformed ones.
  - mcp-skills-10: new `onTransportClose` / `onTransportError` callbacks (plus `mcp.transport.closed|error.total` counters and a WARN log) surface a dead stdio child / dropped HTTP session; previously a disconnect was observable only as protocol errors on later calls.
  - mcp-skills-11: new `MCPClient.readResourceContents(uri)` returns every content item; the single-content `readResource` convenience now WARNs + counts when it truncates a multi-content response.
  - mcp-skills-04 (adjusted): a same-source tool re-registration increments `tool.registry.same-source-replaced.total`, so two server instances colliding on one identity are observable churn instead of a silent swap.
  - mcp-skills-09 (F-10): the documented NESTED `metadata.graphorin` frontmatter form now actually resolves (flat dotted keys still win when both are present); skills.md fixes `sandboxTier` to `sandbox` and the `parseSlashCommand` output shape.
  - mcp-skills-08 (F-9): mcp-client.md rewritten to the real observability surface (counters, no `mcp.tool.invoke` span, no per-call audit rows), the real executor error mapping, and the `.`-namespaced `sideEffectClassByTool` keys; sampling-with-tools / tasks / icons documented as known-unsupported.

- [#138](https://github.com/o-stepper/graphorin/pull/138) [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a) Thanks [@o-stepper](https://github.com/o-stepper)! - Documentation-truth sweep (audit 2026-07-04 Wave E, cluster E10): stale npm package descriptions rewritten (cli "Phase 14a three commands", mcp "upcoming auth CLI", store-sqlite's nonexistent WorkerPool), the store-sqlite WorkerPool TSDoc and the cipher-pragma ordering comment corrected, the executor timeout-precedence JSDoc fixed to the real `inlineToolTimeoutMs > tier timeoutMs > default` order, the `rrf.<label>` explain signals documented, and the skills spec-snapshot wording no longer claims a CI cron refreshes it (the diff is a manual `--upstream` pass; the release gate only parses the bundled snapshot).

- Updated dependencies [[`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`32f20c1`](https://github.com/o-stepper/graphorin/commit/32f20c110f184f8cef7eec85bf39f5f07c886cb6), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`4f850d9`](https://github.com/o-stepper/graphorin/commit/4f850d9bc0a05d6256c59c5117b010336fcb41d3), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`17a2d30`](https://github.com/o-stepper/graphorin/commit/17a2d30564154ca2ab87473335cdef43a5089c84), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`ce06b47`](https://github.com/o-stepper/graphorin/commit/ce06b472af9e30ac5d0792f7a8b6f42170a94627), [`6293a25`](https://github.com/o-stepper/graphorin/commit/6293a2531c5c9265294da22fb365a08f2bdf445a)]:
  - @graphorin/tools@0.6.0
  - @graphorin/core@0.6.0
  - @graphorin/security@0.6.0

## 0.5.0

First version published to the npm registry (with Sigstore build
provenance). The 0.2.0, 0.3.0, and 0.4.0 versions were internal lockstep
milestones and were never published. All `@graphorin/*` packages release
lockstep at the same version; the full release notes for 0.2.0-0.5.0 live
in the repository-level
[CHANGELOG](https://github.com/o-stepper/graphorin/blob/main/CHANGELOG.md).

## 0.1.0

Initial release. See the workspace root `CHANGELOG.md` for the full
release notes; the per-package changelog is generated by Changesets
and tracks subsequent updates.
