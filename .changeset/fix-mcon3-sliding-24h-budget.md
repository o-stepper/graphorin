---
'@graphorin/memory': patch
---

fix(memory): make `budgetResetSemantics: 'sliding-24h'` a real rolling window (MCON-3)

Under `'sliding-24h'`, `bucketStart(now)` returned `now`, so `#maybeReset` saw a
"new bucket" on every call and zeroed the token / cost counters and the paused
flag each time `precheck` / `record` / `snapshot` ran. The tracker never
accumulated spend, a pause was wiped on the next access, and `status()` reported
~zero — i.e. the only consolidator cost-ceiling mechanism was silently
fail-open for anyone who opted into the sliding window. (`'utc'` / `'local'`
were unaffected.)

The sliding window now keeps a timestamped spend ledger, trims it to the
trailing 24h on each check, and recomputes the counters from what remains, so
spend accumulates within the window and only ages out past 24h. A pause set by
`onExceed: 'pause'` survives subsequent checks and auto-clears only once the
window drops back under both ceilings. Adds a regression test covering
accumulation, pause persistence, and age-out; `'utc'` / `'local'` behaviour is
unchanged.
