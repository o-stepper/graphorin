---
'@graphorin/tools': patch
---

fix(tools): sandboxPolicy honesty — advisory WARN + sandbox.enforced span attribute (TL-3)

A non-`'none'` `sandboxPolicy` on an inline (first-party) tool is advisory
— the agent runs inline closures in-process — yet spans surfaced the
resolved policy with no enforcement flag, so a declared-but-not-enforced
policy read as protection.

- Registering an inline tool with a non-`'none'` policy now emits a
  once-per-tool warn (`tool.sandbox.advisory.total` + audit row with a
  hint); module-loadable (skill/MCP) sources are exempt.
- The `tool.execute` span carries `graphorin.tool.sandbox.enforced`:
  `true` when the resolved kind is `'none'` (in-process IS the policy) or
  a real sandbox dispatcher ran the call, `false` when a non-`'none'`
  policy fell back to in-process — operators can alert on it.

(The companion doc fixes — core JSDoc, agent-runtime table, security.md —
landed with AG-18.)
