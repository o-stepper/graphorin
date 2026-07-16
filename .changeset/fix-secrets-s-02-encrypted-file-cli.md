---
'@graphorin/cli': patch
---

Fix the encrypted-file secrets store never activating from the CLI (e2e 2026-07-16, SECRETS-S-02, major). `createSecretsStore({ kind: 'encrypted-file' })` requires an explicit `encryptedFile: { path, passphrase }`, but the CLI's `openStore` forwarded only `kind` / `strict`, and `GRAPHORIN_MASTER_PASSPHRASE` was never consulted - so `graphorin secrets ... --secrets-source encrypted-file` (and the `auto` chain's encrypted-file leg) failed as "unavailable" and long-lived keys could not be stored on a headless host. The CLI now builds the encrypted-file config from the environment: the passphrase from `GRAPHORIN_MASTER_PASSPHRASE` and the bundle path from `GRAPHORIN_SECRETS_FILE` (defaulting to `~/.graphorin/secrets.enc`). Regression test round-trips a secret through the encrypted-file store (skipped where the `@node-rs/argon2` peer is absent).
