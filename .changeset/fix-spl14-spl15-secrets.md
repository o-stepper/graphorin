---
'@graphorin/security': patch
---

fix(security): get() honours the per-tool secrets ACL; validateSecretRefs consults the resolver registry (SPL-14, SPL-15)

- **SPL-14**: only `require()` enforced the per-tool allowlist — any code
  holding a raw `SecretsStore` could `get()` ANY key inside an active tool
  scope with no denial and no audit. `get()` now gates on the ACL across
  every implementation (memory, env, keyring, encrypted-file, chain): a
  denied key reads as `null` with a `'denied'` audit decision. Host-level
  reads outside a tool scope are unchanged (un-gated by design).
- **SPL-15**: `validateSecretRefs` documented `knownSchemes` as
  "BUILTIN_SCHEMES plus any scheme registered through registerResolver"
  but never consulted the live registry — `op://` (1Password) and custom
  resolvers were flagged unknown unless callers passed `knownSchemes`
  manually. The default now unions `BUILTIN_SCHEMES` with
  `listResolverSchemes()` at call time, as documented.
