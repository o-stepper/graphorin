---
'@graphorin/server': patch
---

Twelfth external deep retest, P1: a syntactically broken JSON body (for example a truncated `{"input":`) was swallowed into `{}` by every route's parse helper, satisfied the `.default({})` schemas, and actually executed agents (200), streaming runs (202), and workflows (202). All body-reading routes now answer `400 { "error": "invalid-json" }` before any side effect; a genuinely empty body keeps its documented bodiless-POST meaning. The idempotency middleware rejects broken JSON before fingerprinting or key reservation, so a corrected retry under the same `Idempotency-Key` executes normally instead of colliding with a stored 400.
