---
'@graphorin/tools': minor
---

fix(tools): enforced wall-clock timeout for inline tools (TL-4)

Inline tools had no time bound: the inline branch raced only against the
abort signal, so a hanging tool that ignored `ctx.signal` blocked the
whole run indefinitely — and `ToolErrorKind 'timeout'` had zero producers
anywhere in src.

Inline execution is now bounded by the tier-resolved per-tool `timeoutMs`
(when > 0), overridable with `createToolExecutor({ inlineToolTimeoutMs })`
(an explicit option wins over tier defaults), falling back to the new
`DEFAULT_INLINE_TOOL_TIMEOUT_MS` (60 s). Expiry fails the call with
`ToolError({ kind: 'timeout' })` — its first real producer — the limit is
surfaced on the span (`graphorin.tool.inline_timeout_ms`), and the run
continues past the failed call. The sandbox branch is unchanged.
