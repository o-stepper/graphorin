---
'@graphorin/memory': patch
---

chore(memory): remove the unimplemented episode auto-recall advertising (CE-10)

Locale packs shipped `autoRecallTriggers.episodeTriggers`, the heuristic strategy
computed `episodesTriggered`, and `AssembledPrompt.autoRecall` published it — but
`assemble()` only ever acted on `factsTriggered`. It never searched
`memory.episodic` or rendered an episode block, so the episode-recall surface was
advertised-but-unimplemented drift.

Resolving CE-10 within CE-1, this takes the cheaper option: remove the surface
rather than ship a half-built feature. Gone are
`ContextLocalePack.autoRecallTriggers.episodeTriggers` (and the English defaults)
and `AutoRecallTriggerResult.episodesTriggered`; the docblock now states facts
only. Episodes remain reachable through the `recall_episodes` tool, and episodic
auto-recall can be reintroduced as a real, tested feature later.
