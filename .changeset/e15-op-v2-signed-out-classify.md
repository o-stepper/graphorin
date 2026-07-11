---
'@graphorin/secret-1password': patch
---

Recognize the 1Password CLI v2 signed-out message (E-15, S-17/6): `classifyExitError` now matches `not (currently )?signed in`, so the canonical op v2 stderr line "you are not currently signed in. Please run `op signin --help` for instructions" classifies as `kind: 'signed-out'` with the actionable signin / `OP_SERVICE_ACCOUNT_TOKEN` hint instead of degrading to `unknown` with the generic hint. Adds classifier regression tests driven by realistic op stderr lines (v2 signed-out, legacy signed-out, session expired, v2 not-found, unknown).
