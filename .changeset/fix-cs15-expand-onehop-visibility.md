---
'@graphorin/store-sqlite': patch
---

fix(store-sqlite): expandOneHop only bridges through visible facts (CS-15)

The recursive-CTE traversal in `expandOneHop` applied the visibility predicates
(scope / `deleted_at` / `archived` / `quarantined` / `asOf`) only to the final
output rows. At `maxHops > 1` a tombstoned or quarantined intermediate fact
still conducted the walk, so it could silently bridge two otherwise-unrelated
records. Seed ids were also not intersected with the caller's scope, letting a
foreign fact id act as a traversal root (output stayed scope-filtered, so no
leak — but the wrong graph was walked).

The recursive step now joins `facts fb ON fb.id = w.fact_id` with the same
visibility predicates, so the walk only bridges *through* a fact the caller may
see; the `seed_ids` CTE joins `facts` under `scope_user_id` so out-of-scope
seeds are dropped. One-hop behaviour is unchanged.

Red-first: a real-sqlite 2-hop test (A —[X]— B —[Y]— C) asserts a visible B
bridges A → C, and a quarantined B does not.
