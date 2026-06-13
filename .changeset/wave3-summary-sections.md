---
'@graphorin/memory': minor
---

Add "Errors encountered and resolutions" and "Next steps" to the compaction summary template (SOTA-6). Claude Code and Manus independently found these the two costliest omissions — without them an agent repeats already-fixed errors and loses direction after a compaction. The template grows from nine to eleven sections (`SUMMARY_TEMPLATE_VERSION` → `1.2`); the harness-filled sections (recent turns + metadata) are now resolved as the last two positionally, so they stay correct regardless of how many LLM-produced sections precede them. Locale packs that override `compactionSummaryTemplate.sections` now supply eleven headers.
