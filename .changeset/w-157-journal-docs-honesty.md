---
'@graphorin/workflow': patch
---

Documentation honesty on `journalSteps` and approvals (W-157): the README and guide no longer call the step journal "exactly-once" for side effects - journaled channel writes replay exactly once, but a crash between a task's effect completing and its journal entry landing re-runs the task, so side effects are at-least-once and strict once-semantics need idempotent effects (cross-linked to the re-execution contract). The README's approval example now shows the real API: `requestApproval(name, payload?)` resolved by `workflow.approve(threadId, name, decision)` (there is no `approvalId`).
