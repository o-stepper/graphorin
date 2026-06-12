---
'@graphorin/memory': minor
---

MCON-15: workflow-induction spend joins the cost envelope.
`createProviderWorkflowInducer` accepts an `onUsage` callback;
`createMemory` wires it into the consolidator budget when one is
enabled (`Consolidator.recordExternalSpend`, counted under the
deep-phase bucket) — previously the framework's highest poisoning-risk
LLM call flowed past every daily ceiling. The agent-run completion
auto-hook stays deferred: induction remains an explicit operator call
(`induceFromRun`), per the P2-2 double-opt-in posture.
