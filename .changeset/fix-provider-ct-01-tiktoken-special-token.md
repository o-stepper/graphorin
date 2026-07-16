---
'@graphorin/provider': patch
---

Fix the tiktoken-backed token counters throwing on special-token sequences (e2e 2026-07-16, PROVIDER-CT-01, major). `js-tiktoken`'s `encode` defaults `disallowedSpecial` to `'all'` and throws when the input contains a special-token sequence such as `<|endoftext|>`. Because `createDefaultCounter` routes gpt-*, gemini-*, keyless claude-*, and the Bedrock/Google proxies through `JsTiktokenCounter`, ordinary user or model text containing such a sequence crashed `count` / `countText` - and with them compaction and the token budget. The counter now encodes with `disallowedSpecial=[]`, treating any such sequence as ordinary text (its BPE pieces) instead of a forbidden special token. Regression test pins that counting text with an embedded `<|endoftext|>` does not throw.
