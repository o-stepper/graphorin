---
'@graphorin/observability': minor
---

fix(observability): Luhn-check creditcard redaction + flag mixed-currency cost (RP-21, RP-22)

- **RP-21:** the `creditcard` redaction pattern matched any 13–19 digit run, so
  millisecond epoch timestamps and order numbers were rewritten to
  `[REDACTED creditcard]`, corrupting payloads and inflating counters.
  `RedactionPattern` gains an optional per-match `verify` predicate; the
  `creditcard` pattern now requires a valid **Luhn checksum**, so look-alike
  digit runs are left alone while real PANs are still redacted.
- **RP-22:** the cost tracker's `combine()` summed amounts across currencies and
  overwrote the currency with whichever record came last — a USD + EUR total
  was reported as one clean figure. Aggregation now keeps the first currency
  and sets a **`mixedCurrency`** flag on the snapshot (top-level and per-model)
  when records disagree, so a mixed total is never silently reported.

Red-first tests: a Luhn-valid PAN is redacted while a 13-digit epoch timestamp
is not; a USD-then-EUR session is flagged `mixedCurrency` with the first
currency retained.
