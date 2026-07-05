---
'@graphorin/core': minor
---

W-126: `SpanType` opens up via a namespaced escape: `SpanType = KnownSpanType | CustomSpanType` where `CustomSpanType` is any `` `x.${string}` `` (convention `x.<vendor>.<operation>`). Custom tracers can start spans for operations the framework has no literal for (rerankers, eval steps, ...) without a core release, while typos of known literals stay compile errors (they do not start with `x.`). MIGRATION: external exhaustive switches over `SpanType` need a default branch for the custom domain; span-type analytics must tolerate unknown strings (the policy events already follow). The previous closed union remains exported as `KnownSpanType`.
