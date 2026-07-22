---
'@graphorin/provider': patch
---

`createRequestTimeout` no longer `unref`s its deadline timer, matching the HTTP adapters' timer semantics: an armed deadline now keeps the event loop alive, so a call whose transport holds no handle of its own fails with the timeout error instead of the process draining and exiting mid-call. Real network transports were unaffected (their sockets ref the loop); fixture-driven and bare-script consumers observe the honest timeout now. Caught by the 0.15.0 published-surface smoke.
