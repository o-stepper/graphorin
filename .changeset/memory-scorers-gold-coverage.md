---
'@graphorin/evals': patch
---

Operation-level memory scorers no longer punish verbose-but-correct memories: the default matcher is now token-set F1 OR directional gold-content coverage (function words stripped from the gold side; new `goldTokenCoverage` / `goldCoverageMatcher` / `defaultMemoryPointMatcher` exports plus a `minGoldCoverage` option on the extraction and update scorers). Previously a semantically correct memory (gold `User is pescatarian` vs `The user started eating fish again ... identifies as pescatarian.`, token F1 0.235) was scored missed + hallucinated + omitted at once, deflating extraction recall/precision and the update-omission A/B on small operation benchmarks. Expect extraction and update numbers to shift on existing reports; supply a custom `matcher` to keep the old symmetric-F1-only behaviour.
