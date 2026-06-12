---
'@graphorin/workflow': minor
---

fix(workflow): remove the fake 'async' durability mode (WF-7)

`durability: 'async'` was byte-identical to `'sync'` — both awaited the
same checkpoint put, so users choosing `'async'` for latency got nothing.
A real fire-and-forget writer would conflict with the WF-12 compare-and-set
guard and the WF-8 only-report-real-writes contract, so the mode is removed
instead of faked: `DurabilityMode` is now `'sync' | 'exit'`. A legacy
`'async'` input from JS callers is coerced to `'sync'` with a one-time
stderr warning. Docs and the package description updated.
