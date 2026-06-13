---
'@graphorin/evals': minor
---

`detectRegressions`: the average-duration gate is now **opt-in (default off)**.

`maxAvgDurationIncreaseMs` previously defaulted to `250` ms, so any baseline-vs-current increase in `avgDurationMs` beyond 250 ms was reported as a regression. Absolute wall-clock budgets are environment-sensitive — a fast workstation baseline vs a loaded CI runner, or real LLM-latency jitter of whole seconds — which made the default gate a source of spurious "regressions". It now defaults to `Infinity` (gate off); pass an explicit finite `maxAvgDurationIncreaseMs` to enable an absolute duration gate. The pass-rate and per-scorer average-score gates are unchanged.
