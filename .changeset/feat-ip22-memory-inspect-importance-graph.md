---
'@graphorin/cli': minor
---

feat(cli): `memory inspect` surfaces importance + linked entities (IP-22)

`graphorin memory inspect` claimed to surface "everything the store knows about
one fact" but dropped two real dimensions the store has had since migrations
015 / 016:

- **importance** (the per-fact salience hint) is now read into the projection
  and shown (or "unset — neutral salience").
- **linked canonical entities** — the fact's `subject` / `object` graph links
  are joined from `fact_entities` → `entities`, following `merged_into` so a
  link to a merged entity resolves to its surviving canonical. Each is shown
  with its role, name, id, and the merged-from id when applicable.

The structured result gains `importance` and `linkedEntities`
(`MemoryInspectEntity`). Real-sqlite test seeds a fact with importance and a
merged-entity link and asserts both surface (canonical name, not the merged
alias).
