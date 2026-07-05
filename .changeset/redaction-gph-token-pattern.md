---
'@graphorin/observability': patch
---

Fix the default-on `graphorin-token` redaction pattern: it was hardcoded to a stale `kru_(dev|test|prod)` token shape and never matched real framework tokens, which use the `gph` default prefix with `live|test|local` environment labels (`@graphorin/security` `DEFAULT_TOKEN_PREFIX`). The pattern now matches `gph_<env>_v1_<entropy>_<crc32>` with a loose env label (operators can extend `acceptEnvironments`); deployments that configure a custom token prefix must register their own pattern.
