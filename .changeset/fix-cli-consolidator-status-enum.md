---
'@graphorin/cli': patch
---

`graphorin consolidator status` now queries the run statuses the store
actually writes (`completed`/`failed`) instead of the phantom
`success`/`error`, and counts pending conflict work from
`conflict_check_pending` instead of a non-existent `pending` run status
— the dashboard showed 0/0/0 forever (MCON-5). The stale module header
claiming a polled `consolidator_admin` table is gone along with the
dead table-creation helper.
