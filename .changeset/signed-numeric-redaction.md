---
'@graphorin/observability': patch
'@graphorin/provider': patch
'@graphorin/security': patch
---

Grammar-safe redaction now handles signed numeric JSON leaves (deep-retest 0.13.5 P2). Masking `{"card":-4111111111111111}` previously left the minus sign stranded before an unquoted mask (`{"card":-[REDACTED creditcard]}`), producing invalid JSON in all three layers. The new span-based helper `jsonSafeSpan` (exported from `@graphorin/observability/redaction/patterns`, with a local twin in the security guardrail) absorbs the leading sign into the replaced span and emits the quoted mask, so the document stays parseable; a prose minus (`refund -4111... issued`) is untouched. `jsonSafeMask` remains exported with its exact historical behaviour for span-fixed callers, and both docblocks now state the whole-text ambiguity: a text consisting solely of the match is indistinguishable from a single-value JSON document and gets the quoted form. The security `credit-card` pattern is also digit-anchored on both ends, so the match no longer swallows the separator after the PAN (the `[REDACTED:credit-card]` marker used to glue onto the following word). Shared regression corpora (signed leaves in objects / arrays / top level, mixed verifier outcomes) plus seeded JSON-preservation property tests now run in all three suites: any valid JSON document stays valid after redaction.
