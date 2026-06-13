---
'@graphorin/skills': minor
---

fix(skills): a folder skill cannot self-promote to a trusted tier (RP-9)

A `{ kind: 'folder' }` skill took its trust level straight from its own
`graphorin-trust-level` frontmatter, so a directory downloaded from the
internet declaring `trusted` was loaded as trusted — no signature, sandbox
`inherit-frontmatter`, and its tool outputs were **not** taint-marked
`skill-untrusted`, blinding the data-flow policy and skipping inbound
sanitization.

Trust is now granted by the integrator, never the artifact:

- The folder source gains an optional `trustLevel` (operator override),
  matching the `npm-package` / `git-repo` sources.
- Without an override, a folder's self-declared `trusted` /
  `trusted-with-scripts` is **capped at `unknown`** (sandbox forced,
  signature optional, outputs taint-marked); `untrusted` / `unknown` pass
  through unchanged.
- The resolved level is written back onto the skill metadata, so every
  downstream consumer — tool stamping, sandbox tier, inbound sanitization —
  sees the integrator-resolved trust rather than the self-declaration.

Red-first loader tests assert a self-declared-`trusted` folder loads as
`unknown` with untrusted tool stamping, and that an explicit operator
`trustLevel` override is honoured. The trust-posture table in
`documentation/guide/skills.md` is updated.
