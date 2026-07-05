---
'@graphorin/tools': patch
---

Dataflow sink-gate consistency (W-118): `DataFlowGuard.inspect` now receives the raw-shaped POST-REPAIR arguments (`effectiveArgs` from the validate phase) instead of the model's original `call.args` - the same payload the approval gate and the argument policy already evaluate, and the payload the executed input is deterministically derived from. Spans introduced by the arg-repair hook are now visible to the verbatim taint probe; without a repair hook the behavior is bytes-identical. Documented residual limitation: probing happens before schema coercion, so text introduced purely by Zod `transform`/`default` is not probed.
