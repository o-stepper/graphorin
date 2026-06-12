---
'@graphorin/embedder-transformersjs': minor
'@graphorin/core': patch
'@graphorin/memory': patch
---

fix(embedder-transformersjs): apply E5 query/passage prefixes (PS-10)

The default embedder is `multilingual-e5-base`, whose model card requires
asymmetric `query:` / `passage:` prefixes — but nothing applied them, so both
indexing and query embeddings were silently degraded.

- `EmbedOptions` gains `taskType?: 'query' | 'passage'` (core). The
  transformers.js embedder prepends the matching E5 prefix for E5-family models
  (the default and any id carrying an `e5` token), defaulting to `passage` when
  unspecified; symmetric models are untouched. A new `disableTaskPrefix` option
  opts out.
- The memory tiers thread the role: `passage` on `remember` / episode writes /
  conflict-candidate comparison, `query` on semantic + episodic search.
- The prefix policy is part of the embedder's `configHash` (only for E5), so
  enabling it re-keys the embedder id.

**Migration:** an existing E5 index built before this change reports an embedder
mismatch under `lock-on-first` — run `graphorin memory migrate` to re-embed, or
pass `disableTaskPrefix: true` to keep the old unprefixed behaviour and id.

Red-first: a capturing-pipeline test asserts E5 inputs are prefixed by taskType
(and non-E5 are not), the `configHash` flips with the policy (and is unaffected
for symmetric models), and a memory test asserts `remember` embeds as `passage`
while `search` embeds as `query`.
