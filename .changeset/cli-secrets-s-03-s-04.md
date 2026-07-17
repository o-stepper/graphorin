---
"@graphorin/cli": patch
---

fix(cli): SECRETS-S-03/04 honour ref flags and detect read-only writes

- SECRETS-S-03: `secrets ref` now threads `--secrets-source` / `--strict-secrets`
  and activates the requested store before resolving, so `ref:` URIs resolve
  through the chosen store instead of failing with "No active SecretsStore".
- SECRETS-S-04: `secrets set` reads the value back after writing and fails loudly
  when the active store is read-only (e.g. the env resolver), instead of
  reporting ok:true / exit 0 for a write that never persisted.
