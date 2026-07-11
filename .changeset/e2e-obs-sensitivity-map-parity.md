---
'@graphorin/observability': patch
---

Make replay sensitivity decisions identical across trace sources (E-18, S-20/9): `serializableRecord` now serializes `sensitivityByAttribute` for spans and events, so the JSONL replay log no longer loses every per-attribute tier (previously `minSensitivity` was inert for JSONL-sourced replays and public-tagged attributes were over-stripped to `{}` on re-sanitization). Symmetrically, `sanitizeRecord`/`sanitizeEvents` now prune tier-map entries for attributes stripped at export, so map-preserving sources (SQLite span store, in-memory) no longer skip a whole already-sanitized span at replay because of a stale `secret` entry whose value never reached the sink. One span exported through both paths now yields byte-identical persisted tier maps and identical `skipBySensitivity` outcomes.
