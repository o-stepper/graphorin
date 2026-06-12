---
'@graphorin/provider': patch
---

fix(provider): real FIFO queue for withRateLimit 'queue' mode (PS-18)

In `'queue'` mode, every concurrent waiter computed the same `waitMs` from the
shared empty bucket, slept once, then unconditionally set `tokens = 0` and
passed — so N concurrent requests on an empty bucket all woke after a single
refill interval and burst through on ~1 token. There was no re-check loop and no
ordering.

`acquire` now enqueues waiters on a per-bucket FIFO and a single drain loop
grants them one token at a time, sleeping until the next token actually refills.
Grants track the real refill schedule and preserve arrival order; an aborted
waiter is removed from the queue and rejected. `'throw'` mode is unchanged.

Red-first: a controllable-clock test (sleeps resolve only when the clock is
advanced past their wake time, so concurrency is observable) fires three
concurrent waiters on an empty bucket and asserts exactly one is granted per
refill interval, not a burst of three at the first tick.
