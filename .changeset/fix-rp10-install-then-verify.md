---
'@graphorin/security': minor
'@graphorin/skills': patch
---

fix(security): install-then-verify for npm / git skills (RP-10)

Loading an `npm-package` / `git-repo` skill at the default (untrusted) trust
level **always threw `SkillSignatureMissingError` before anything was
downloaded**: the installer verified the signature first and a default load
has no pre-fetched `skillMd`. The only escape was `trustLevel: 'trusted'`,
which disables the signature gate entirely — exactly the wrong ergonomic
nudge. The orphan `void readFileSync;` was a leftover of the unimplemented
post-install read.

The installer is now **install-then-verify**:

- The package is fetched into a quarantine directory first (with
  `--ignore-scripts` still enforced), then `SKILL.md` is read from the
  install path and its Ed25519 signature is verified.
- A rejected (missing / tampered signature) package fails **after** the
  install and its quarantine directory is removed; the cleanup hook fires on
  a thrown verification error too, not just the `valid: false` shape.
- A caller-supplied `skillMd` still wins for offline / pre-fetch verification.

`@graphorin/skills`: `locateSkillRoot` now also probes the npm
`node_modules/<packageName>` layout so an installed package actually
resolves.

Red-first tests drive a default `loadSkillFromSource({ kind: 'npm-package' })`
against a fake package-manager runner: a signed skill loads with no manual
`skillMd`, and an unsigned skill rejects after install with the quarantine
directory cleaned up. `documentation/guide/skills.md` documents the
install-then-verify flow.
