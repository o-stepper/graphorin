---
'@graphorin/memory': minor
'@graphorin/agent': patch
---

W-056: the compaction-summary wrapper marker has a single canonical definition. `@graphorin/memory` now exports `COMPACTION_SUMMARY_TAG` / `_OPEN` / `_CLOSE` / `_MARKER` from the module that renders the summary template, and the agent runtime imports (and re-exports) `COMPACTION_SUMMARY_MARKER` instead of defining its own literal. The VALUE is unchanged and frozen - persisted summaries in existing session stores carry it - with pin tests in both packages asserting the raw literal so a change breaks CI rather than migrating silently.
