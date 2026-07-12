---
'@graphorin/memory': minor
'@graphorin/server': minor
'@graphorin/store-sqlite': minor
---

Trigger consolidation on a settled segment (item 7, A2). New `buffer:N` consolidator trigger fires the light+standard chain when the unconsolidated transcript tail (from the standard-phase cursor) reaches N tokens - measured with the same chars/4 proxy over the same rendering as the W-081 transcript budget. The tail is evaluated on activity signals via the new `Consolidator.notifyActivity(scope?)`; the documented contract is "buffer:N OR idle:T", whichever comes first, with the existing trigger cooldown damping bursts. The server wires the signal automatically: the run tracker (the single choke point every REST/WS run passes) now emits activity events - every tracked run resets the triggers scheduler's idle window (`recordActivity()`, making `idle:T` a true debounce), and a settled run re-evaluates `buffer:N`. `RunStateTracker.setActivityListener` and the `buffer` trigger reason/spec are additive API.
