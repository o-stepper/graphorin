---
'@graphorin/provider': patch
---

fix(provider): match dated Anthropic ids + family-aware OpenAI token encoding (PS-20)

The model-tier classifier's Anthropic patterns (`/^claude(?:-\d)?-?haiku/`, …)
only allowed a single optional one-digit version segment, so real dated ids —
`claude-3-5-haiku-20241022`, `claude-3-7-sonnet-20250219` — classified as
`undefined`, and there was no rule for the `fable` family. Separately, the token
counter pinned `cl100k_base` for every OpenAI/OpenAI-compatible model, under-counting
the o200k_base families (gpt-4o, gpt-4.1, gpt-5+, o-series).

- The Anthropic version segment is now `(?:-[\d.]+)*-?` (zero-or-more dotted/dashed
  numeric groups), matching `claude-3-5-haiku`, `claude-3-7-sonnet`, and the
  `claude-haiku-4-5` form — direct and Bedrock. A `fable` rule sits next to `mythos`.
- New `defaultOpenAiEncoding(model)` picks `o200k_base` for gpt-4o / gpt-4.1 /
  gpt-5+ / o-series and `cl100k_base` for legacy gpt-4 / gpt-3.5; the dispatcher
  uses it as the JsTiktoken fallback encoding.

Red-first: classify fixtures for the dated ids + fable, and a counter table
asserting gpt-4o → o200k_base while gpt-4 stays cl100k_base.
