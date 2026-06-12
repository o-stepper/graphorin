---
'@graphorin/security': patch
---

fix(security): piiDetection 'rewrite' actually redacts object/array values (SDF-6)

Detection ran over `JSON.stringify(value)` — so structured values MATCHED —
but the rewrite payload was `typeof value === 'string' ? redacted : value`:
for objects and arrays the guardrail reported `ok:false, action:'rewrite'`
with a redaction message while `composeGuardrails` substituted the
UNREDACTED original back into the flow. Structured payloads with
emails/SSNs/cards passed verbatim under a false sense of redaction.

The check now deep-walks string leaves (arrays and plain objects recurse;
other values pass through), redacting in place — a rewrite is never equal
to the unredacted input, for any value shape. String behaviour unchanged.
