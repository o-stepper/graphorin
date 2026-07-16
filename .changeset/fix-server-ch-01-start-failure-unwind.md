---
'@graphorin/server': patch
---

Fix a failed server start stranding already-started daemons (e2e 2026-07-16, SERVER-CH-01, major). The domain gateway starts LAST, so a vendor channel adapter throwing during `start()` left the consolidator, scheduler, and workflow-timer daemons running with no way to stop them - and because the failed start reset `started`, a follow-up `stop()` threw `LifecycleNotStartedError`, so the public handle could not unwind the leak (an always-on deployment could only recover by killing the process). `start()` now unwinds every already-started daemon (in reverse order) and closes a bound listener before rethrowing, and `stop()` after a failed start is a safe no-op instead of throwing. Regression test injects a gateway whose `start()` throws and asserts the earlier-started timer driver is stopped and `stop()` resolves.
