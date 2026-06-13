---
'@graphorin/secret-1password': patch
---

Wave-4: fix the 1Password `op` CLI hard-timeout hang (SPL-22). The timeout previously sent only `SIGTERM`, deferring rejection to the `'close'` event — so a wedged `op` that ignored `SIGTERM` left the promise unsettled forever. The timeout now escalates to `SIGKILL` after a short grace and rejects directly from the timer, so the hard timeout always settles. Adds an injectable-`spawn` factory `createOpCli({ spawn })` (production keeps using `createDefaultOpCli`) so the escalation path is unit-tested cross-platform.
