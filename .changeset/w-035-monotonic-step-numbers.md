---
'@graphorin/agent': minor
---

`RunStep.stepNumber` stays strictly monotonic and unique across suspend/resume cycles (W-035): the loop counter seeds from the journal's max instead of restarting at 0, and the resume-dispatch step (plus its intent/dispatched checkpoints and `step.start` events) takes max + 1 instead of a hard-coded 0. Dashboards or snapshots that expected resume steps to be numbered 0, or post-resume numbering to restart at 1, will observe the corrected continuing sequence. Exactly-once resume mechanics are unaffected (they key on toolCallId, never on step numbers).
