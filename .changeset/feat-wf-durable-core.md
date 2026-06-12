---
'@graphorin/workflow': minor
'@graphorin/core': minor
'@graphorin/store-sqlite': patch
---

Durable workflow core: the persisted checkpoint now carries the full resumable frontier (every pending pause, Dispatch task, and completed-but-unwalked node), so suspension no longer loses sibling work (WF-1) and a node body with several sequential `pause()` calls round-trips each operator value to the right call via ordered replay (WF-2, `runWithPauseResume` now takes a values array). Crashed threads (latest checkpoint `'running'`) are resumable, clean boundary aborts persist the new `'aborted'` status, and the new `Workflow.retry(threadId)` restarts a `'failed'` thread by replaying the successful tasks' persisted pending writes and re-running only the failed work (WF-3/WF-6). Checkpoint puts are guarded by a compare-and-set on the latest stored checkpoint — a lost race surfaces as `checkpoint-version-conflict` instead of a forked timeline, and concurrent `execute()` on a live thread is refused (WF-12). Node bodies receive a deep-frozen state snapshot (mutation throws, WF-9), an all-false conditional fan now fails fast with the new `dead-end` error instead of silently completing (WF-14), and `durability: 'exit'` no longer reports or parent-links checkpoints it never wrote (WF-8).
