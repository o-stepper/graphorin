---
'@graphorin/core': patch
'@graphorin/tools': minor
'@graphorin/mcp': patch
---

fix(tools): handle reads carry the PRODUCER taint — spills no longer launder to trusted (TL-6)

Spill artifacts are written raw (before sanitization, preserving full data
for non-model consumers), and `read_result` is a trusted built-in with a
`pass-through` default — so an untrusted tool's spilled body came back
unsanitized AND re-labelled trusted, and the dataflow ledger recorded the
read under `first-party-built-in` (provenance laundering).

- The executor now remembers each spill artifact's producer
  (`trustClass`/`source`/`sensitivity`, in-memory per executor) and stamps
  `ResultHandle.producerTrustClass` (new optional core field).
- When a handle whose producer is untrusted is read back, the content is
  re-sanitized with the producer-class policy (`detect-and-strip-and-wrap`)
  — including the `content` field of object outputs, which bypass
  `wrapOutput` — and `DataFlowGuard.record` receives the PRODUCER's trust
  class/source/sensitivity, not the reader's.
- `ResultReadOutcome` gains optional `producerTrustClass` so readers can
  report provenance; the MCP resource reader always reports
  `'mcp-derived'`, closing the `resource_link` path too.
- Handles from a resumed prior process are not in the in-memory map and
  fall back to the reader-reported class (consistent with WI-12's
  per-run taint scope).
