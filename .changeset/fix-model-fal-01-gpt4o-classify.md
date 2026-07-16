---
'@graphorin/provider': patch
---

Fix `classifyModelTier` returning `undefined` for the gpt-4o family (e2e 2026-07-16, MODEL-FAL-01, minor). The `openai-mini` / `openai-nano` rules matched only a numeric version (`gpt-(\d|\d+\.\d+)-mini`), so the `o` in `gpt-4o-mini` stopped the match, and the balanced `openai-gpt` rule's `(?!.*(?:mini|nano))` lookahead excluded it too - leaving `gpt-4o-mini` (the id the routing docs use as their concrete example) unclassified. The patterns now allow an `o` version suffix, so `gpt-4o-mini` / `gpt-4.1-mini` classify as `fast` and `gpt-4o` stays `balanced`.
