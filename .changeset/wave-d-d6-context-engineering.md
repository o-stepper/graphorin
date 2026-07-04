---
'@graphorin/core': minor
'@graphorin/agent': minor
---

Context engineering trial (audit 2026-07-04 Wave D, cluster D6) - opt-in; tool surface unchanged by default.

- Structured plan tool (`update_plan`, TodoWrite-style full-replace checklist) journaled in the new `RunState.todos` (core `TodoItem`), surviving suspend/resume via the strict run-state (de)serializer.
- Attention recitation: the current plan is rendered into a compact `<plan>` block appended to each step's request copy - request-only and cache-layout-aware (rides the last prompt-cache anchor, never touches the shared buffer or persisted state).
- `AgentConfig.plan` opt-in. Progress files, resume-recap injection, and the degraded-mode ladder are documented as trial follow-ups.
