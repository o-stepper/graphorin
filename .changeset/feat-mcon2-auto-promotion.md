---
'@graphorin/memory': patch
---

feat(memory): opt-in auto-promotion of injection-clean extraction facts (MCON-2, part 3)

Adds the consolidator's `autoPromoteExtraction` flag (**off by default** at every
tier). When enabled, the standard phase admits an **injection-clean** extraction
fact as `active` instead of quarantined, so routine distillation surfaces in
default recall without a manual `memory review --promote`. Injection-flagged
writes always stay quarantined — the security gate is preserved — and episodes,
insights, and induced procedures are unaffected (they remain
quarantined-until-validated). It is a deliberate opt-in that trades the fail-safe
default for convenience.

Threaded as a per-call `FactRememberOptions.autoPromoteSynthesized`, so the
policy applies only to the consolidator's writes and not to direct
`memory.semantic.remember(...)` calls. Enable via
`createMemory({ consolidator: { autoPromoteExtraction: true } })`.

Note: the audit also describes restricting promotion to *user-derived* facts.
Per-fact source-message role is not tracked through extraction (facts are
distilled from the whole transcript window), so this slice gates on the
injection heuristics — the security-relevant criterion — and documents the
limitation rather than approximating provenance unsafely.
