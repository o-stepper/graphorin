---
'@graphorin/memory': patch
---

W-087: the multi-query fan-out now embeds every variant in ONE `embedder.embed([q1..qN])` call instead of N sequential round-trips (a real win only with remote/async embedders), and the HyDE hypothetical-answer LLM call is started before the FTS/vector fan-out loop so it overlaps with those legs instead of running after them. A batch-embed failure degrades to the previous per-variant path; the single-shot (no fan-out) path performs exactly the same calls and returns byte-identical results.
