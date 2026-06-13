---
'@graphorin/memory': minor
---

Add a compaction reclaim-floor (SOTA-4): `CompactionConfig.trigger.minReclaimTokens` defers any compaction whose predicted reclaim — the older, compactable portion of the buffer (everything but the preserved recent turns) — is below the floor. This prevents compact-thrash at the threshold (paying a summarizer call to reclaim a handful of tokens, then re-triggering as the buffer grows back). Opt-in: unset / `0` keeps the current behaviour byte-identical.
