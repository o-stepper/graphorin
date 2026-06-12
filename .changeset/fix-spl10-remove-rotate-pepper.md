---
'@graphorin/security': minor
---

fix(security): remove the impossible rotatePepper helper (SPL-10)

`rotatePepper`'s docstring claimed to "re-HMAC every token row with a new
pepper" by re-deriving plaintexts via re-hashing — cryptographically
impossible. The implementation delegated everything to caller-supplied
`oldHashLookup`/`recomputeHash` callbacks and never used `newPepper`
beyond a strength check: an empty shell that counted rows while
implying a rotation had happened.

The helper is removed. `rekeyTokens` — revoke-and-reissue with fresh raw
values — is the only sound rotation and remains the supported path; the
pepper-strength check it implied now runs everywhere a pepper is consumed
(SPL-11). Docs and the README list updated.
