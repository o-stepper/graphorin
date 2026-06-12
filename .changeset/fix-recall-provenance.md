---
'@graphorin/memory': patch
---

MST-10: `recall_episodes` and `deep_recall` outputs carry the record's
trust-provenance tag (mirroring `fact_search`), so a consumer can tell
a synthesized (consolidator-extracted / reflected) memory from a
first-party one — recalled text re-enters the model as trusted tool
output weeks after the write-time heuristics ran.
