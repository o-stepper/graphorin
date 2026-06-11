---
'@graphorin/store-sqlite': patch
'@graphorin/memory': patch
---

fix(memory): real per-tier `count()` for honest `metadata()` (CE-5, MST-6)

`gatherMemoryMetadata` computed `factCount` / `episodeCount` from
`search({ query: '*', topK: 1 })` — capped at 1, and **deterministically 0 on
real SQLite** (`escapeFtsQuery('*')` tokenises to nothing). A production deploy
therefore told the model "Facts: 0 / Episodes: 0" regardless of how full the
store was, which can suppress recall-tool use. `messageCount` materialised up to
1000 message rows just to take `.length`, and `activeRuleCount` counted
still-quarantined induced rules despite being documented as *active* rules.

- Adds `count(scope)` to the semantic / episodic / session stores — a
  `COUNT(*)` with the same default-recall filters (live, non-archived,
  non-quarantined), never materialising rows — surfaced via the store-ext
  interfaces.
- `gatherMemoryMetadata` now uses `count()` for facts / episodes / messages and
  filters `status !== 'quarantined'` for `activeRuleCount`.
- Removes the in-memory fixture's `'*'`-match-all special-case (the last
  consumer of `'*'`-as-match-all is gone), so the fixture no longer masks the
  divergence from the real store — completing the cleanup deferred from MCON-18.

Real-sqlite test: 5 facts / 3 episodes / 2 messages / one active + one
quarantined rule ⇒ `factCount: 5`, `episodeCount: 3`, `messageCount: 2`,
`activeRuleCount: 1`.
