---
'@graphorin/evals': minor
'@graphorin/observability': minor
---

`runEvals` now returns a **partial report** on abort instead of discarding completed work.

Previously an aborted `signal` threw out of the worker, rejecting `Promise.all` and throwing away every case that had already finished — a long LLM-judged run lost everything to a Ctrl+C. `runEvals` now stops dispatching new cases on abort and resolves with a partial `EvalReport` whose `results`/`summary` cover the cases that completed, marked with a new optional `aborted: true` field on `EvalReport`. Pass the new `throwOnAbort: true` option to restore the previous throw-on-abort behaviour.
