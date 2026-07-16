---
'@graphorin/agent': patch
---

Fix the default lateral-leak denial catalogue never firing (e2e 2026-07-16, LATERAL-L-01, major). When a tool call failed, the run loop recorded only `tool.error:<toolName>` on the CausalityMonitor chain, but `DEFAULT_DENIAL_PATTERNS` match the error IDENTITY (`SecretAccessDenied`, `ToolApprovalDenied`, `SandboxViolation`, ...), so no runtime-recorded entry could ever match and an out-of-the-box monitor (`causalityMonitor: { strictness }` with no custom patterns) was inert - a headline injection defense that silently did nothing. The chain entry now includes the error kind and a bounded error message alongside the tool name, so the default catalogue matches a real denial failure. Regression test drives a tool that fails with a `SecretAccessDenied` identity through a monitor configured with only the defaults and asserts the leak is detected.
