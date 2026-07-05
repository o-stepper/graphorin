---
'@graphorin/eslint-plugin': patch
---

Retarget stale security rules to the current API surface (audit 2026-07-04 Wave E, cluster E1). `no-secret-in-deps` matched the pre-0.5 `Agent.toTool({ inheritSecrets })` shape that no longer exists (the rule could never fire); it now matches the real DEC-137 grant point, `withChildToolSecretsContext({ secretsAllowed: [...] })`, still requiring the `rb-24-justification` comment. `no-implicit-network-call` regains parity with `scripts/check-no-network.mjs` (EB-10): undici/got namespace calls, raw `net`/`tls`/`dgram` sockets, `new WebSocket`/`EventSource`, and static/dynamic/`require()` imports of HTTP clients are now flagged. Stale "scaffolds for the eventual public ruleset" package description replaced; the removed `no-console-in-public-api` row dropped from the README.
