---
'@graphorin/provider': patch
---

fix(provider): map content_filter + honest abort finish reason (PS-12)

The OpenAI-shaped streaming adapter's `mapFinishReason` only matched the dashed
`content-filter`, but the wire format sends `content_filter` (underscore), so a
content-filtered completion silently reported `'stop'`. And breaking the stream
loop on `req.signal.aborted` emitted a `finish` with the default `'stop'` rather
than `'aborted'` (same in the native Ollama adapter).

`content_filter` now maps to `'content-filter'`, and an aborted stream finishes
with `finishReason: 'aborted'` in both adapters.

Red-first: a streaming test asserts a `content_filter` chunk yields a `finish`
with `finishReason: 'content-filter'`.
