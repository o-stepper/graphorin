---
'@graphorin/agent': patch
---

W-103 / W-104: enabling `dataFlowPolicy` without any way to arm the lethal-trifecta leg is now visible. The agent prints one construction-time warning when the policy is on, `guardTrifecta` is not disabled, `treatPiiAsSensitive` is unset and no registered tool declares a sensitivity within the effective `sensitiveTiers` (default `['secret']` - and no built-in tool ships with that tag): in that configuration the only active default signal is the best-effort verbatim probe, which paraphrasing bypasses. The security and agent-runtime guides now state this explicitly and document the recommended adoption ladder (shadow -> tag private-data tools -> widen tiers/PII -> derivedTaint strict -> enforce). Runtime policy behaviour is unchanged.
