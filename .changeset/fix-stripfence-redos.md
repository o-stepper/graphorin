---
'@graphorin/memory': patch
---

fix(memory): harden LLM code-fence stripping against ReDoS

The internal `stripFence` helper shared by the LLM-response parsers
(workflow induction, iterative retrieval, query transformation, reflection,
reconciliation, and the standard/deep consolidator phases) used
`/^```(?:json)?\s*\n([\s\S]*?)\n```/`, whose `\s*\n` prefix overlaps the lazy
`[\s\S]*?` content match and backtracks polynomially on adversarial provider
output starting with a fence and many `\n ` repetitions (CodeQL
`js/polynomial-redos`, high severity). Replaced the ambiguous prefix with a
deterministic `[^\n]*` that consumes the rest of the fence line, eliminating
the overlap while preserving behaviour (the language tag and any trailing
fence-line text are still stripped). No public API change.
