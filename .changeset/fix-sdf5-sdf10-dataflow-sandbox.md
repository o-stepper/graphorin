---
'@graphorin/security': patch
---

fix(security): taint-ledger span floor + untrusted-tier timeout floor (SDF-5, SDF-10)

- **SDF-5**: a `minSpanLength` below the 8-char trustworthy window made
  `TaintLedger.inspectArgs` always return `carriesUntrustedVerbatim: false`
  while still tracking spans — the exact opposite of the documented
  "lower = more sensitive", silently disabling verbatim detection. The
  effective `minSpanLength` is now clamped UP to the floor; the type doc
  states the floor.
- **SDF-10**: `resolveSandbox` let an operator disable the mandatory
  wall-clock timeout on the untrusted tier with `override.timeoutMs: 0`
  (the value passed through and the worker set no timer). A non-positive
  timeout on a forced tier is now coerced to the tier default and flips
  `forced: true` with a reason.
