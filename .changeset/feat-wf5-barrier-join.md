---
'@graphorin/workflow': minor
---

Barrier channels now actually wait (WF-5): a node fed by two or more writers of one Barrier channel is treated as a join and is deferred until every writer in the barrier's `from` has produced a value — an asymmetric fan-in no longer runs the join early with a partial map and then a second time. A barrier that can never complete surfaces as a `dead-end` error instead of a partial join.
