---
'@graphorin/tools': patch
---

fix(tools): widen the inbound-sanitization scan budget so a loaded runner doesn't fail open

`applyInboundSanitization` skips the imperative-pattern strip pass when its scan
exceeds the time budget (fail-open by design, to avoid over/under-redacting on a
partial scan). The 50 ms default is fine warm, but a *loaded* shared CI runner
(windows-latest under a full matrix) has been observed pushing the cold-V8 scan
past it — so an attacker-supplied MCP tool description slipped through
**unredacted** under load. Raises the default to 250 ms: still imperceptible for
a one-shot registration-time scan, and it keeps the strip pass actually running
on slow machines instead of silently failing open. Callers that need a stricter
budget still pass `budgetMs` explicitly.
