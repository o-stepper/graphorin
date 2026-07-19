---
'@graphorin/cli': patch
'@graphorin/security': patch
---

Two deep-retest (2026-07-19) fixes to the operator onboarding path:

- **`graphorin init --cloud-consent` is now actionable (P1-4).** The chosen tier used to land only as a `.ts` comment (and vanish entirely from the JSON flavour). `init` now prints the exact `createMemory({ contextEngine: { privacy: ... } })` snippet that ENFORCES the tier as step 5 of the next-steps, and the `.ts` config embeds the same code - both flavours hand the operator the real wiring instead of a decorative choice (memory is composed in code, so the server config genuinely cannot enforce it).
- **`doctor --all` no longer false-fails on a disabled audit log (P2-1).** A config-driven `doctor` now reports the audit-encryption check as `skip` when the supplied config has `audit.enabled: false`, instead of failing on a binding the disabled subsystem never needs. `checkEncryption(...)` in `@graphorin/security` gains an optional `{ auditEnabled }` argument; the internal "Phase 05" jargon is dropped from the hint.
