---
'@graphorin/memory': minor
---

- MCON-14: every consolidator LLM request now carries a per-call
  `maxTokens` output cap (extraction 1024, episode 512, reconcile 256,
  deep judge 256, reflection questions/insight 512, situating-context
  256). Budget accounting only runs after `generate` returns, so an
  uncapped degenerate response could blow through a daily ceiling in a
  single call before `pause` could act.
- MCON-12: the extraction prompt now asks for a per-fact 1–10
  importance rating; `FactInput.importance` (clamped to `[0, 1]`)
  carries it onto the persisted fact, so the X-1 multi-signal salience
  score finally differentiates facts by importance — migration 015's
  `facts.importance` column was never populated by any path.
