---
'@graphorin/store-sqlite': patch
---

fix(store-sqlite): atomic session push + unique message sequence (CS-9)

`SessionMemoryStore.push` ran three separate statements — `SELECT MAX(sequence)+1`,
the message `INSERT`, and the FTS `INSERT` — with no transaction and no
uniqueness constraint on `(scope_session_id, sequence)`. A crash between the
message and FTS inserts left a committed message that was silently unsearchable,
and two processes (server + CLI) racing on the same session could compute the
same sequence and interleave history.

- The read, the message insert, and the FTS insert now run inside one
  `conn.transaction` — they commit together or roll back together.
- Migration 022 adds `UNIQUE INDEX (scope_session_id, sequence)` (subsuming the
  prior non-unique index on the same columns), turning a cross-process sequence
  collision into a loud constraint failure instead of a silent duplicate.

Red-first: a real-sqlite test injects an FTS-insert failure and asserts the
message row is rolled back; a second asserts a duplicate `(scope_session_id,
sequence)` insert is rejected by the schema.
