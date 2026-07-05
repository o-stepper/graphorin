---
'@graphorin/mcp': patch
---

ReDoS guard hardening (W-078): `looksCatastrophic` now also rejects the alternation-overlap exponential family (`^(a|a)+$`, `^(\w|\d)*$`) - previously only groups whose body ends with a quantifier were caught, so these classic shapes ran on the raw engine and a ~1k-char non-matching input from an untrusted server could stall the event loop practically forever. Additionally, any pattern containing a quantified group now runs under a reduced 1000-char tested-string cap (defense-in-depth against polynomial backtracking). Conservative false positives degrade the pattern to permissive validation - the semantics already documented for guarded and malformed patterns; alternations without a quantified group still validate exactly as before. The TSDoc no longer overclaims: covered classes are enumerated and a linear-time engine (re2) is named as the exact solution.
