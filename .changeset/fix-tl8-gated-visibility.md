---
'@graphorin/tools': patch
'@graphorin/agent': patch
---

fix(tools): approval-gated tools are visible in code-mode, not silently absent (TL-8)

Approval-gated tools are excluded from the `code_execute` API by design
(durable HITL cannot suspend mid-script) — but invisibly: the catalogue
simply omitted them, so a model facing a task that needs a gated tool got
no explanation and could stall or hallucinate.

- The `code_execute` description now lists gated tools in a dedicated
  "NOT callable from code_execute" section with the call-it-directly
  rationale; `code_search` finds them with the same marker.
- A bridged script call to a gated tool fails with the structural hint
  ("requires human approval … call it directly as a standalone tool call")
  instead of an opaque unknown-tool error.
