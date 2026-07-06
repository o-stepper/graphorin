---
'@graphorin/memory': patch
---

W-144: the HyDE candidate leg now forwards `includeSuperseded` and `owner` to the vector search, matching the direct FTS / vector / graph / entity legs. Previously an audit search with `{ hyde: true, includeSuperseded: true }` silently evaluated the HyDE leg validity-now, so superseded facts reachable only through the hypothetical-answer embedding never surfaced, and the owner filter on that leg relied on post-fusion filtering instead of the in-store predicate.
