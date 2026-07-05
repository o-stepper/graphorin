---
'@graphorin/cli': patch
---

W-007: `graphorin traces status|prune` now operates on the REAL `spans` table (migration 024) instead of a `traces` table no migration or runtime ever created. The command was a permanent no-op ("traces table not found") - an operator with `traces prune` in cron believed retention was handled while spans grew without bound. `status` reads counts + ISO time range from `start_unix_nano`; `prune` delegates to `pruneSpans` (deletes spans that FINISHED strictly before `--before`, index-backed). JSON field names (`oldestStartedAt`/`newestStartedAt`) are unchanged, so machine consumers keep working. NOTE: an existing cron `traces prune` will now actually delete old spans - that is the documented behavior finally happening.
