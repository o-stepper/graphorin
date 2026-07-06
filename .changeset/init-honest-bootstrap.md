---
'@graphorin/cli': minor
---

W-003/W-041: `graphorin init` stops printing a dead credential and stops teaching argv secrets.

init generated and printed a "bootstrap admin token (shown ONCE)" whose hash was never persisted anywhere - verification requires an HMAC lookup in the auth-token store (migrations + pepper), and init's contract is "write the config file only" - so the token was guaranteed to 401; the working path (`graphorin token create` after `migrate`) was not even mentioned. Following the IP-4 honesty precedent, init no longer emits a token (`InitCommandResult.bootstrapToken` removed - BREAKING for scripts parsing it, though the value never worked) and the next-steps now walk the real path: (1) persist the pepper via stdin - `printf '%s' '<hex>' | graphorin secrets set graphorin_server_pepper --from-stdin`, never `--value` on argv, which parked the key material behind every token HMAC in shell history (W-041); (2) `graphorin migrate`; (3) `graphorin token create --label bootstrap` (raw token shown once, verifiable); (4) `graphorin start`. The pepper hex is still printed exactly once to stderr.
