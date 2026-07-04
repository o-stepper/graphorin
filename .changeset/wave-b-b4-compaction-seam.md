---
'@graphorin/agent': patch
'@graphorin/memory': patch
---

Compaction-seam hardening (audit 2026-07-04 Wave B, cluster B4).

- context-engine-05: the agent's pinned-prefix scan stops at the `<graphorin_compaction_summary>` marker, so a compaction summary resumed from a suspended run stays compactable instead of being absorbed into the uncompactable prefix (one extra pinned summary per compact-then-resume cycle).
- context-engine-06: hard context overflow gets a last-resort tier - on a `context-length` provider error the agent forces ONE aggressive compaction (`preserveRecentTurns: 2`) and retries the same provider before walking the fallback chain or failing. Thrown `ProviderHttpError`s now classify by their canonical `errorKind`, so a thrown 429 / overflow is treated like the structured-event equivalent.
- context-engine-07: the summarizer prompt's older-messages dump is capped (default 96k chars, `summarizerInputCharBudget` strategy option; oldest lines elided with a marker) so pointing `summarizerModel` at a smaller model no longer overflows its window and silently disables compaction.
- context-engine-09: `<<<older_messages>>>` / `<<</older_messages>>>` sequences inside message text are neutralized before entering the summarizer prompt's data-only envelope - a tool result carrying the closing marker can no longer inject instructions into the summarizer.
- context-engine-10: new integration test drives the REAL context engine through the agent loop with tool loops crossing the threshold; the mock provider's transcript invariant validates every post-compaction request.
