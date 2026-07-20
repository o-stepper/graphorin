---
'@graphorin/secret-1password': patch
---

Fix the 1Password CLI invocation: `op read` has no `--reveal` flag (that flag belongs to `op item get`), so every resolve failed with `unknown flag: --reveal` against the real CLI (verified on op 2.35.0). The wrapper now spawns `op read --no-color '<uri>'`, argv-shape tests pin the exact spawn contract, and a real-binary integration leg (`GRAPHORIN_RUN_OP_INTEGRATION=1`, wired into the weekly `integration-real` workflow with a pinned op 2.35.0) proves the flags parse without any 1Password account. The `no accounts configured` stderr of op CLI 2.35+ is now classified `signed-out` with an actionable setup hint (desktop-app CLI integration, `op account add`, `OP_SERVICE_ACCOUNT_TOKEN`, or Connect) instead of `unknown`.
