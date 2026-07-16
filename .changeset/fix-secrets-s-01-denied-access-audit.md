---
'@graphorin/tools': patch
---

Fix a denied per-tool secret access leaving no audit row (e2e 2026-07-16, SECRETS-S-01, security). The `ctx.secrets` accessor gates through the per-tool ACL directly, so when a tool asked for a key outside its `secretsAllowed` the `SecretAccessDeniedError` was thrown without an audit event - unlike the store path, whose `auditStoreOperation` already records denials. The accessor now emits one `secret:get` / `decision: 'denied'` audit event (attributed to the tool, with run/session/agent pointers, never the secret value) before re-throwing, so the documented "fails closed AND writes one audit row" contract holds. The emit is on the accessor path only, so the store path is not double-counted. Regression test pins that a denied `ctx.secrets.require()` produces exactly one denied audit event.
