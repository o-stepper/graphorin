---
'@graphorin/tools': patch
---

fix(tools): bound structured tool outputs to maxResultTokens (TL-2)

`wrapOutput` returned a non-string (object/array) output unchanged whenever the
body was truncated or sanitized, so the executor computed the bounded text and
the inbound-sanitization scan and then **threw both away**: the agent inlined
the entire object (`JSON.stringify(output)`) into history, blowing past
`maxResultTokens`, and any injection marker sitting beyond the cap reached the
model verbatim. MCP `structuredContent` results are exactly this object-output
shape, so an untrusted server hit the bypass directly.

Two changes close it:

- `wrapOutput` now returns the bounded text for *any* output type once the body
  was truncated/sanitized — the model sees only the bounded, scanned text,
  never the full object. (A small, unchanged output still passes through with
  its structure intact.)
- A structured output on the default `'middle'` strategy is routed through
  **spill-to-file by default**, so the full blob is preserved behind a
  `read_result` handle while only a bounded preview enters context. The
  text-mirror content part MCP adapters emit is bounded the same way. Explicit
  `'tail'` / `'summarize'` / `'spill-to-file'` strategies are honoured.

Red-first tests cover an over-cap object (bounded + handle), an injection
marker beyond the cap inside an object (not leaked), the MCP `structuredContent`
ToolReturn shape (output + text mirror both bounded), and a small object
(untouched passthrough). `tools.md` and `agent-runtime.md` updated for the
bounded-object / spill-by-default semantics.
