---
'@graphorin/cli': patch
---

`graphorin token revoke` and `graphorin token rotate` now print a propagation note: the CLI writes the token store directly, so a running server may keep honoring the token for up to its verifier-cache TTL (default 60s); revoke via `DELETE /v1/tokens/:id` on the live server (which evicts the cache synchronously) or restart it for immediate effect.
