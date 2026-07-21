---
'@graphorin/provider': patch
---

Unsupported-parameter recovery for current OpenAI reasoning models (eleventh deep retest P1). The OpenAI-shaped adapters now recover, once per provider instance and with a WARN, from the two GPT-5.6-class HTTP 400s that used to hard-fail every memory/eval/tool path pinning `temperature: 0`: a 400 rejecting `temperature` re-sends the request without the field (nothing is substituted - the determinism intent cannot be honored) and omits it for the instance's lifetime, and a 400 requiring `reasoning_effort: 'none'` for function tools on chat completions re-sends with it, scoped to tool-carrying requests. The new `unsupportedParamRecovery: 'auto' | 'off'` option (default `'auto'`) disables both recoveries when set to `'off'`, and an explicit `providerOptions` value for either field keeps failing loudly. Follows the `tokenLimitParam` learned-remap precedent, so no model tables are involved.
