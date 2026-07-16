---
"@graphorin/evals": patch
---

fix(evals): EVALS-REP-01 make the regression boundary exclusive and float-robust

`detectRegressions` compared drops against their tolerances with a strict `>` on
raw floats, so a drop that lands exactly on the tolerance (e.g. a 5.00pp drop
that `(1 - 0.95) * 100` computes as `5.000000000000004`) flipped to a spurious
regression. The boundary is now consistently exclusive with a small epsilon
guard across all three gates (pass-rate, avg-score, duration), and the
`RegressionOptions` docstrings describe the max-tolerated-drop (exclusive)
contract that the module doc and guide already stated.
