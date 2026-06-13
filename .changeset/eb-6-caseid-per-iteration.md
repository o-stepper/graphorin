---
'@graphorin/evals': patch
'@graphorin/observability': patch
---

Disambiguate eval caseIds per iteration (EB-6).

Both eval runners (`runEvals` in `@graphorin/evals`, `runEval` in
`@graphorin/observability`) appended the `-iter-N` suffix only to the
*synthetic* fallback id — a caller-supplied `case.id` was reused **verbatim**
across iterations. So a dataset with explicit ids run at `iterations: 3` emitted
three results under one caseId, and JUnit/HTML reporters rendered
indistinguishable testcases that per-case diffing could not key on.

Both runners now suffix `-iter-N` for explicit ids too whenever `iterations > 1`
(single-iteration runs are unchanged, no suffix), so every result in a report
has a unique caseId.
