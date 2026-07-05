---
'@graphorin/security': minor
'@graphorin/tools': minor
'@graphorin/agent': minor
---

W-101: the Rule-of-Two `untrustedInput` leg is actually enforced. It previously fed only `heldLegs`/`holdsFullTrifecta` bookkeeping - a profile giving up the leg still had every web-search/MCP tool callable while both remaining legs were live, exactly the configuration the preset promises to prevent. `buildRuleOfTwoPolicy` now compiles `untrustedInput: false` into a forbid rule over untrusted-SOURCE tools, decided by the new exported `isUntrustedTrustClass` (`@graphorin/security/dataflow`) so the preset and the taint engine share one definition of "untrusted". `ToolCallFacts` gains `untrustedSource?`; the tools executor passes the tool's `trustClass` into `ToolArgumentPolicyGuard.evaluate` (type-level breaking for custom structural guard implementations); the agent adapter derives the fact from it. Untrusted content in user messages is explicitly out of this rule's scope (documented).
