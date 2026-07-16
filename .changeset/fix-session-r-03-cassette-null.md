---
'@graphorin/sessions': patch
---

Fix `readToolCassette` crashing with a raw `TypeError` on a JSON `null` body line (e2e 2026-07-16, SESSION-R-03, minor). A `null` line parsed cleanly, then `parsed.kind` was read before checking the value was a non-null object, so `null` escaped the format guard that already rejects scalars/arrays with the typed `CassetteFormatInvalidError`. The reader now rejects any non-object line (null, array, scalar) with the typed error. Regression test added.
