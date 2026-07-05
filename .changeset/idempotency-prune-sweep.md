---
'@graphorin/server': patch
---

Disk-hygiene fix (W-061): expired `idempotency_records` (each row stores the full `response_json` of a keyed POST) are now swept from the database on a periodic timer (`scheduleIdempotencyPruning`, hourly, unref-ed, stopped on `server.stop()`). Previously `SqliteIdempotencyStore.prune` existed but had zero callers - expiry was only checked on the read path, so response bodies accumulated on disk indefinitely. The sweep deletes exactly the records the read path already refuses to replay; IETF-draft replay semantics are unchanged.
