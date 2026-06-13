---
'@graphorin/agent': patch
---

Step-journal foundation: a resumed approved tool call now executes **exactly once across re-resumes** (closes AG-1 systemically). When a prior resume already ran a granted approval and recorded the completed call in `RunState.steps`, a second resume of the same still-pending state replays the journaled result instead of running the side effect again — so resuming the same suspended state twice (a retry, or two processes reading the same checkpoint) cannot double-fire a payment or external write. A journal entry whose result message was lost falls through to at most one re-execution. Also corrects a stale `agent-runtime.md` caveat that claimed approved calls were not re-executed on resume.
