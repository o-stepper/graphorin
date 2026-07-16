---
"@graphorin/memory": patch
---

fix(memory): MEMORY-C-03 gate the compaction default on a providerContextWindow

A bare `createMemory()` auto-enabled compaction from the default trust policy
with no `providerContextWindow`, leaving a dead-Infinity trigger and warning on
every construction. The trust-based default now only enables compaction when a
window is present, so the bare case is off and silent (functionally a no-op:
compaction could never fire without a window). An explicit `compaction` config
without a window still throws (CE-12). Removes the now-dead one-time WARN and its
test-only reset.
