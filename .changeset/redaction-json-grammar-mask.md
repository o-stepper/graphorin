---
'@graphorin/observability': patch
'@graphorin/provider': patch
'@graphorin/security': patch
---

Masking a bare numeric JSON leaf now keeps the document parseable: when a redaction match occupies a JSON value position, the mask is emitted in double quotes (`{"card":4111111111111111}` becomes `{"card":"[REDACTED creditcard]"}`), in all three layers - the `withRedaction` provider middleware, the OTLP `RedactionValidator`, and the security `piiDetection` guardrail. Prose and string-leaf masking are unchanged. The helper is exported as `jsonSafeMask` from `@graphorin/observability/redaction/patterns`.
