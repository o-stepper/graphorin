---
'@graphorin/security': patch
---

fix(security): serialise concurrent appendAudit on one AuditDb (SPL-4)

`appendAudit` does a read-modify-write — `db.latest()` to read the tip
`seq`/`hash`, then `db.insert()` — with an `await` point between the two and
no serialisation across callers. Four audit bridges plus the server's
per-request audit middleware and replay routes all share one `AuditDb`
handle, so concurrent calls read the same tip, compute the same `seq`, and
the UNIQUE `seq` primary key rejects all but one — a silently-dropped audit
entry (a probabilistic audit-evasion primitive: flood concurrent requests so
a hostile request's append loses the race). The loss is verifier-invisible
because no gap appears in `seq`.

- A per-`AuditDb` write chain (`WeakMap<AuditDb, Promise>`) now serialises the
  whole `latest()`→`insert()` critical section at the source, covering every
  caller including the un-queued middleware/replay paths. Chain hashing means
  a transactional `seq` alone would not suffice — the section must be atomic.
- The four audit bridges (secrets / oauth / memory-guard / supply-chain) now
  log a dropped write via the shared `reportDroppedAuditWrite` when no
  `onWriteError` is configured, instead of swallowing it.

Red-first: `append-concurrency.test.ts` runs N concurrent `appendAudit` against
a strict in-memory `AuditDb` (UNIQUE `seq`, realistic async gap) — pre-fix only
one of N survives; post-fix all N land with contiguous seqs and an intact chain.
