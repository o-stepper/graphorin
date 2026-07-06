---
'@graphorin/workflow': minor
---

The WF-10 JSON-safety gate now covers the whole checkpoint, not just channel state (W-121): pause values and approval payloads, `Dispatch` args, satisfied resume values (and their W-120 metas), and the failure-frontier task args are walked with the same fail-fast checker before persist, throwing the typed `state-not-serializable` error with a `<pause:node>` / `<dispatch:node>` / `<task:node>` pseudo-channel and exact path. Operator directives are additionally validated at resume ENTRY (`<directive>` pseudo-channel) - a `Date` in `Directive({ resume })` now fails immediately instead of persisting as an ISO string that the node body silently receives on the next replay. Code that previously "worked" with silently-degrading values will now fail fast - the same deliberate contract WF-10 already established for state.
