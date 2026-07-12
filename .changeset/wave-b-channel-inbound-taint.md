---
'@graphorin/security': minor
'@graphorin/agent': minor
'@graphorin/tools': minor
'@graphorin/core': minor
---

Channel-inbound trust boundary (bot-adoption wave B, B1.5). New `'channel-inbound'` member of the core `ToolTrustClass` union, registered in the single `UNTRUSTED_TRUST_CLASSES` source so the taint engine and the Rule-of-Two untrusted-input leg agree by construction; `defaultInboundSanitization` maps it to `detect-and-strip-and-wrap`. The `TaintLedger` gains an optional `recordInboundMessage` entry (same widening + verbatim-span semantics as `recordOutput`) - a first-class input for message-borne untrusted content, which the Rule-of-Two deliberately does not derive from ordinary user messages. Agent side: `DataFlowGuardWithLedgers.recordInboundMessage` plus the new `AgentCallOptions.inboundTaint` seed, stamped in run init before the first step (after the AG-19 resume seed; widen-only), so a channel gateway arms the data-flow policy for every run it starts.
