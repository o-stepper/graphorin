---
'@graphorin/tools': patch
---

Make truncation annotations actionable (A8). When a tool result is truncated to fit the result cap, the inline `graphorin:result:truncated` annotation now tells the model what to do next — re-run with a narrower request (date range / filter / limit) for the omitted part, or fetch the full result via `read_result` for the spill strategy — instead of an opaque "this was truncated" marker. The hint is terse (negligible against the default cap) so it does not crowd out content. Keeps the model's self-correction loop productive.
