---
'@graphorin/memory': minor
---

MST-8 / MRET-14: WorkingMemory honesty pass.

- `BlockSpec.defaultValue` finally does something: a defined-but-
  unwritten block answers `read()` with its declared default, and the
  first mutation composes with it instead of starting from an empty
  string. The write-only `#initialised` bookkeeping is gone.
- Mutating a `readOnly` block now throws the dedicated
  `WorkingBlockReadOnlyError` (kind `'working-block-read-only'`) — it
  used to throw `WorkingBlockReplaceMismatchError(label, 0)`, which
  reads as "your unique substring matched 0 times" and misled callers
  that retry replaces on mismatch.
