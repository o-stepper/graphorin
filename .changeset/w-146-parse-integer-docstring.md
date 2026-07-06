---
'@graphorin/reranker-llm': patch
---

`parseIntegerResponse` now carries the correct PS-14 doc contract (W-146): the stale pre-hardening docstring ("Score: 7" / "7/10" via first-integer extraction) is gone, and the doc block is attached to the function itself (an interposed helper had detached it, leaving the generated API page empty). Behaviour is byte-identical: only a bare whole-string integer is accepted; verbose replies fall back to the configured score.
