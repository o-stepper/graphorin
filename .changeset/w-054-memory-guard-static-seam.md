---
'@graphorin/agent': patch
---

W-054: the SDF-1 memory-guard region reader now calls the statically-typed `Memory.working.compile(scope, agentId)` directly instead of reaching working memory through an `as unknown as` double cast with optional-chaining. A future signature change on `WorkingMemory.compile` breaks the agent BUILD instead of silently degrading the DEC-153 guard to an empty region read. Runtime semantics are unchanged: the reader stays best-effort (a throwing compile still degrades to an empty string and never fails the run). The remaining variance cast on the plan-tool registration is registration-time-only and out of this finding's scope.
