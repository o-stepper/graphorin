---
'@graphorin/store-sqlite': patch
---

`TriggerStore.recordFire` now carries a monotonic wall-clock fence (W-133): a fixation whose `firedAt` is not strictly later than the stored `last_fired_at` is a no-op, so a second (unsupported) scheduler process re-fixing an old fire cannot rewind `next_fire_at`/`missed_fires`. Supported single-process behaviour is unchanged. `claimReadyBatches` is documented as a plain non-claiming SELECT whose concurrent-drain serialization belongs to the CS-8 consolidator scope lock (the name stays: it sits on the stable contract surface).
