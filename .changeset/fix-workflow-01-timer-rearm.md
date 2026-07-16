---
'@graphorin/workflow': patch
---

Fix the durable timer driver never re-arming at the earliest future wake (e2e 2026-07-13, WORKFLOW-01, major). Each sweep only queried threads already due (`listSuspended({ dueBefore: now })`) and computed the next wake-up from THEIR results, so a thread suspended with a short future timer never contributed - `nextWakeAt` stayed undefined and the next pass was scheduled a full `pollIntervalMs` (default 30s) away, making a `sleepFor(300ms)` durable timer wait out the whole interval. The sweep now looks one poll interval ahead (`dueBefore: now + pollIntervalMs`): threads already due still fire, and the earliest not-yet-due thread within the window sets `nextWakeAt`, so `schedule()` re-arms at `min(pollIntervalMs, earliest wakeAt)`. Regression test pins that a not-yet-due timer inside the poll window populates `nextWakeAt` and shortens the re-arm delay.
