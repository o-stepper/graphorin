---
'@graphorin/workflow': patch
---

fix(workflow): fork() produces a self-contained, continuable thread (WF-17)

`fork()` cloned one checkpoint verbatim: the forked root kept a `parentId`
pointing into the SOURCE thread (dangling lineage), and `pendingWrites`
were not copied — so retrying a forked `failed` checkpoint silently LOST
the writes of tasks that had already succeeded.

The forked root now drops `parentId` (it is a root in its own thread) and
carries the source checkpoint's pending writes, so a forked
`failed`/`aborted` checkpoint is `retry()`-able with the succeeded tasks
replayed from the copied write log. Status semantics pair with WF-3:
suspended/running/aborted forks `resume()`, failed forks `retry()`,
completed forks can be re-`execute()`d.
