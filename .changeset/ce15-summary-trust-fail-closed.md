---
'@graphorin/memory': patch
---

CE-15 hardening: the compaction summary-trust decision now fails CLOSED when the injection scanner returns a null verdict, and the scan of the (bounded) summarizer output runs without a wall-clock budget. Previously a budget expiry on a contended host silently failed the check open, committing a potentially poisoned summary as `trusted`; a degraded CI runner reproduced exactly that. A timed-out scan now yields `summaryTrust: 'untrusted-derived'` (the summary is wrapped in the derived-trust envelope), never `trusted`.
