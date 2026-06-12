---
'@graphorin/workflow': minor
---

fix(workflow): advertised diagnostics are real (WF-11)

- `workflow.task` spans now wrap every executed task (ok/error mirrors the
  outcome) and `workflow.checkpoint` spans wrap every persisted checkpoint —
  both were promised by the guide/README/SpanType union but never created.
- The `maxSteps` runaway cap throws the dedicated `'max-steps-exceeded'`
  code instead of masquerading as `'invalid-config'`.
- A cancellation whose grace window (`cancelGraceMs`) expires with tasks
  still unsettled reports `'workflow-cancel-timeout'` (previously folded
  into plain `workflow-aborted`); a clean boundary abort is unchanged.
- `'cycle-detected'` is removed from the `WorkflowErrorCode` union and docs:
  cycles are legal in this engine by design — runaway loops are bounded by
  `maxSteps`.
