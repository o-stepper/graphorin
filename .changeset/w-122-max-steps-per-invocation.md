---
'@graphorin/workflow': minor
---

`maxSteps` now caps steps PER INVOCATION of execute/resume/retry/tick (W-122) - the infinite-loop safeguard it was documented as - instead of the thread lifetime: a durable thread cycling through timers/approvals for months no longer dies at 200 cumulative steps, and a capped-out invocation is retryable with a fresh budget (engine-level failures without a step task list now restore through the suspended-style frontier walk on retry). The cumulative `stepNumber` is untouched (WF-4 checkpoint ordering) and gains the opt-in `WorkflowConfig.maxTotalSteps` lifetime quota (same `max-steps-exceeded` code, distinct message). Rare consumers relying on the lifetime-cap behavior should set `maxTotalSteps`.
