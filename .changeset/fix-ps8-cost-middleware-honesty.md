---
'@graphorin/provider': patch
---

fix(provider): real cost accumulator + loud unenforced-ceiling warning (PS-8)

`withCostTracking` advertised a "process-local accumulator" and exported
`CostTrackingTotals` documented as reachable via an `accumulator()` callback —
but neither existed, and without `onUsage` the middleware was a complete no-op.
`withCostLimit` was silently inert when a ceiling was set without
`resolveObservedCost`, so the budget looked enforced but never tripped.

- New `createCostAccumulator()` returns a real `CostAccumulator`: wire its
  `onUsage` into `withCostTracking` and read running per-`provider × model`
  totals back via `.totals()` / `.totalFor()` (`CostTrackingTotals` is now the
  genuine return type). The misleading docstrings are corrected.
- `withCostLimit` now warns once at construction when a `maxPer*` ceiling is set
  without a resolver (silently unenforced → loud); the no-ceiling-no-resolver
  case stays the documented inert placeholder.

Red-first: an accumulator test asserts callCount / token / cost totals across
two generations plus `reset()`, and a cost-limit test asserts the
unenforced-ceiling warning fires once (and not at all without a ceiling).
