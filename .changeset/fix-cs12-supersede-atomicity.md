---
'@graphorin/store-sqlite': patch
---

fix(store-sqlite): write the successor before closing the old fact in supersede (CS-12)

`supersede()` closed the old fact's validity interval, set its `superseded_by`,
and wrote the audit row inside a transaction, then `await this.remember(newFact)`
*after* it. A crash in that window left the old fact closed and pointing at a
`superseded_by` id that was never written — so `asOf(now)` returned no version of
the fact at all.

The successor is now written first (`remember()` opens its own transaction and
cannot be nested), and only then does the close transaction run. A failure
before the close leaves the old fact fully intact — open interval, no
`superseded_by` — which is recoverable, instead of a dangling pointer with no
resolvable version.

Red-first: a real-sqlite test injects a throwing successor write and asserts the
old fact keeps `superseded_by IS NULL` / `valid_to IS NULL` and the phantom
successor row does not exist.
