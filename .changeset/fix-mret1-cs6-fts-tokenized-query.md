---
'@graphorin/store-sqlite': patch
---

fix(store-sqlite): tokenise FTS5 queries so multi-word recall works offline (MRET-1, CS-6)

`escapeFtsQuery` wrapped the entire query in double quotes, turning every
search into a single FTS5 *phrase* query across all four full-text surfaces
(sessions, episodes, facts, insights). A natural-language question like
`where does Anna work` only matched a verbatim, adjacent run of those tokens,
so reordered or non-adjacent terms scored zero lexical hits — fatal in the
offline default, where (with no embedder) the FTS leg is the only retrieval
signal.

The query is now tokenised on whitespace and each token is quoted
independently and combined with the FTS5 `OR` operator. Per-token quoting
still neutralises operator characters and reserved keywords (user input cannot
inject FTS5 syntax), while OR-ing restores recall for multi-word queries
regardless of word order or adjacency. Whitespace-only input falls back to the
prior (empty) phrase form, and a bare `*` probe stays byte-identical. Adds
real-sqlite regression tests for multi-word recall and operator-character
safety, and documents the hybrid-search FTS semantics in the memory guide.
