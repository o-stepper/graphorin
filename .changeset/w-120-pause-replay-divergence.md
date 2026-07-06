---
'@graphorin/core': minor
'@graphorin/workflow': minor
---

Positional pause replay now detects divergence (W-120). Every satisfied resume value is journaled together with the identity of the pause it answered (`PendingPauseRecord.satisfiedMeta`: durable-primitive kind + awakeable/approval name), and `pause()` verifies the identity at each cursor during replay - a node whose pause ORDER depends on time/state/model output fails loudly with the new typed `pause-replay-divergence` WorkflowError (naming the node and the expected vs actual pause) instead of silently delivering a value to the wrong wait. Conservative by design: two plain `pause()` calls carry no identity and are never flagged (false positives impossible), and checkpoints written before the field existed replay their old values unchecked. Consumers with exhaustive switches over `WorkflowErrorCode` must add the new member; workflows that previously "worked by accident" with crossed values will now fail - that is the finding.
