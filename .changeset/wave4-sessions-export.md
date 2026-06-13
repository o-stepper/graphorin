---
'@graphorin/sessions': patch
---

Wave-4 (RP-7): session-export honesty. `readSessionExport` now cross-checks the footer's declared `recordCount`/`messageCount`/`handoffCount`/`agentCount` against the records it actually parsed and emits a `footer-count-mismatch` warning on a discrepancy — a truncated body previously read clean whenever no `--hash` checksum was present. Also corrected the stale `SESSION_EXPORT_BACKWARDS_COMPAT_MAJORS` docstring (it said the value is `0`; it is `2`).
