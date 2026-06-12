---
'@graphorin/store-sqlite': patch
'@graphorin/memory': patch
---

fix(memory): drive reflection off episode recency + add a watermark so it stops re-firing (MCON-1, MRET-6, MCON-13)

The deep-phase reflection gate and `EpisodicMemory.recent()` probed for recent
episodes with an FTS `search(scope, '*')`, which `escapeFtsQuery` turned into
the phrase `"*"` — a query that matches **zero rows** on real SQLite. Only the
in-memory test fixture special-cased `'*'` as match-all, so reflection looked
healthy in tests but never fired in production (offline `full` tier), `recent()`
always returned `[]`, and the deep-phase insight pipeline was dead.

- New `EpisodicMemoryStoreExt.listRecent(scope, limit, { includeQuarantined })`
  (`ORDER BY ended_at DESC`) — recency, not relevance — implemented by the
  default `@graphorin/store-sqlite` adapter and surfaced as
  `EpisodicMemory.listRecent`. `recent()` and the reflection gate now use it;
  the `'*'` probe is gone.

Once the gate actually fires, reflection re-summed the same top-N episodes on
every deep run and, past the importance threshold, re-paid the salient-questions
+ insight-synthesis LLM calls every pass (MCON-13). Added a persisted reflection
watermark (migration 018 — a nullable `reflection_watermark` column on
`consolidator_state`): the gate accumulates importance only from episodes newer
than the watermark and advances it after a pass, and new insights are
exact-deduped against stored ones before insert. A deep run with no new episodes
now makes no reflection LLM calls and writes no duplicates.

Covered by a real-sqlite integration test (reflection fires, `recent()` is
ordered, a second run does not re-fire), each guard demonstrated red-before /
green-after. The `metadata.ts` `factCount`/`episodeCount` `'*'` probe is a
separate `count()`-method fix (MST-6 / CE-5) and is unchanged here.
