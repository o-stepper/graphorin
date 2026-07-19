---
'@graphorin/observability': patch
'@graphorin/provider': patch
'@graphorin/security': patch
---

Redaction no longer corrupts serialized numbers. The `withRedaction` provider middleware now honours per-pattern `verify` predicates in both the request scrub and the streaming scan (previously only the OTLP validator did), the built-in `creditcard` pattern refuses decimal-adjacent digit runs and requires a major-network leading digit (2-6) on top of the Luhn checksum, and the security guardrail's `credit-card` and `us-phone` patterns gained the same boundary guards. Previously a `fact_search` score such as `0.01639344262295082` or an epoch-ms timestamp inside a JSON tool result came back as `[REDACTED creditcard]`, breaking the JSON. Real PANs are still masked.
