---
'@graphorin/security': patch
---

`containsPii` now applies the same Unicode obfuscation pre-pass as the injection catalogue (W-150): NFKC folding plus zero-width stripping via the new case-preserving `normalizeForPiiMatching` (exported from guardrails), so zero-width-split emails and fullwidth-digit SSNs/cards trip the FIDES `sensitiveSeen` taint leg instead of dodging it. Case is preserved because the IBAN and BTC-address patterns are case-sensitive by design. The `piiDetection` guardrail's redaction path still matches the raw text (offset-based rewriting needs the original string) - documented on the guardrail.
