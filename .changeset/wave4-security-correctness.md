---
'@graphorin/security': minor
---

Wave-4 security correctness & honesty (low-severity audit tail):

- **SDF-11** — the taint ledger's verbatim-carry fold is now NFKC + alphanumeric-only, so inserted-punctuation, space-for-space substitution, zero-width and fullwidth-homoglyph obfuscation no longer defeat untrusted-content detection. Still best-effort: aggressive paraphrase and cross-script confusables remain out of scope (documented).
- **SPL-20** — new opt-in `SupplyChainPolicy.precedence`. Default `'allow-wins'` is byte-identical to prior behaviour (the allowlist short-circuits, so a scope can be denied with specific exceptions). `'deny-wins'` evaluates the deny lists first, so a broad allowlist glob can no longer override an explicit denylist entry.
- **SPL-21 / export honesty** — `pruneAudit`/`exportAudit` docs now state that a prune removes only the longest contiguous expired prefix (an expired entry sitting behind a not-yet-expired one is retained — never a hole in the hash chain) and that a prune recomputes every surviving entry's hash, invalidating hashes archived from an earlier export.
- **SPL-23** — `TokenVerifier.verify()` now documents its single `TokenVerifyOverloadError` throw on backpressure (it resolves for all auth failures); removed stale `void`-suppressed unused imports in `auth/crud.ts` and `oauth/authorize-code-flow.ts`.
