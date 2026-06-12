---
'@graphorin/tools': patch
---

fix(tools): approval flow no longer leaks per-call contexts (TL-11)

Any tool with `needsApproval` defined — even a static `true` — eagerly
built a full per-call context (sandbox resolve, streaming channel, abort
listener on the run signal) just to evaluate the predicate, threw it away,
and built a second one for the real execution. Worse, BOTH contexts'
run-signal listeners lived until the end of the run: a long run with many
gated calls accumulated two listeners per call (MaxListeners warnings).

- A static boolean skips the predicate context entirely; the function form
  gets one that is disposed right after the predicate runs.
- Linked signals now `release()` their parent listener when the call
  settles — listeners on the run signal stay bounded regardless of call
  count.
