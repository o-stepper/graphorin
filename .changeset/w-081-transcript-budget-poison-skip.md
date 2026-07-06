---
'@graphorin/memory': minor
---

W-081: no slice can permanently wedge the consolidation cursor any more. Two changes:

- New `maxTranscriptChars` config (per-tier default 60 000 chars ~ 15k tokens, 120 000 at `full`, overridable via `createMemory({ consolidator: { maxTranscriptChars } })`): the standard phase half-splits a slice whose rendered transcript exceeds the budget BEFORE the provider call, reusing the convergent W-020 recursion (`maxStandardBatchSize` bounds only the message count, so a batch of long messages could exceed a cheap model's context on every retry). A single message that alone exceeds the budget is tail-truncated. Both events are recorded on the phase span (`consolidator.standard.budget_splits` / `.input_truncations`).
- Poison-slice skip: when a standard-phase batch exhausts its DLQ retries and the cursor still points inside the failed window, the cursor is force-advanced past the window (logged; `messageIds` stay on the exhausted row for manual replay). The gate is membership-based - the cursor advances only when the next unprocessed message falls inside the exhausted window - so it can never move backwards. Deliberate, bounded fact loss beats losing every subsequent slice.
