---
'@graphorin/eslint-plugin': minor
---

Wave-4 (PS-21): remove the `no-console-in-public-api` rule. It shipped as a permanent no-op scaffold since Phase 01 and was never part of the `recommended`/`flat/recommended` presets, so removing it changes no enforcement — per the implement-or-delete policy it is deleted rather than left inert.
