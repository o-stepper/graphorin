---
'@graphorin/protocol': patch
---

W-109: the package doc no longer promises forward-compatible negotiation that does not exist. It now states the actual contract: the frame ENVELOPE (kind set, control-frame fields, the `v: '1'` literal) is validated strictly on both sides and evolves only lockstep (the 0.x deployment model; `v: '2'` frames are rejected), while the deliberate additive extension points live inside the envelope (event `type` + `payload: z.unknown()`, RPC `result: z.unknown()`, the `initialize` capabilities record - which the shipped client currently does not consume). New contract tests pin both classes of behaviour: unknown event types and arbitrary payload/result values pass; extra envelope fields, unknown kinds and `v: '2'` fail. No schema or wire behaviour changed.
