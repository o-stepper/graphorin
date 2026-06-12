---
'@graphorin/tools': patch
---

Re-export the `ApprovalGate` interface from the executor barrel. The type is
referenced by `ExecutorOptions.approvalGate` but was previously unreachable
for consumers importing from `@graphorin/tools`.
