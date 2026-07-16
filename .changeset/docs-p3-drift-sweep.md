---
'@graphorin/core': patch
'@graphorin/agent': patch
'@graphorin/provider': patch
'@graphorin/evals': patch
'@graphorin/client': patch
'@graphorin/security': patch
'@graphorin/proactive': patch
---

P3 documentation-drift sweep from the 2026-07 e2e campaign - docstring corrections only, no behavior changes: binary-json's `URL` corruption claim (a URL stringifies to its `href`, not `{}`; CORE-PRO-02); `isAgentFallbackEligible`'s bypass list now names the real `ProviderErrorKind` values (MODEL-FAL-02); `bySensitivity` / `stripSensitiveOutputs` document their actual weak redaction-token contract with an explicit warning instead of a nonexistent part-level sensitivity annotation (AGENT-FIL-01/02); `ProtocolGuardConfig` no longer advertises a nonexistent `Agent.protocolGuard` key (LATERAL-L-03); the token-counter serializer documents the real `[file:<mimeType>]` placeholder and the counter dispatch table the real per-family OpenAI encodings (PROVIDER-CT-02/03); `RegressionOptions` tolerances document their strictly-exceeds semantics (EVALS-REP-01); the reconnect backoff formula matches the implementation (`2^(attempt-1)`; ORPHAN-SU-02); the memory guard states its five tiers (CLI-05); the proactive cron-task docs speak about E1 deny-by-name in the present tense.
