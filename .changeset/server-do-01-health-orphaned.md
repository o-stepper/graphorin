---
"@graphorin/server": patch
---

fix(server): SERVER-DO-01 surface the triggers orphaned count on /v1/health

The triggers daemon status reports `orphaned` (persisted rows with no registered
declaration), but the `/v1/health` `checks.triggers` block dropped the field even
though the docs promise it. `TriggersCheck` now carries `orphaned` and the health
collector copies it (0 on the failure branch).
