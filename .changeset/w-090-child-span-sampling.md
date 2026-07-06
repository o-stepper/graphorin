---
'@graphorin/observability': minor
---

Per-type sampling rules now apply to CHILD spans under the default parent-based decision maker (W-090) - `{ type: 'tool.execute', rate: 0.01 }` finally thins the per-call spans inside sampled `agent.run` traces, where the volume actually lives, as the docstring always promised. Rules only ever downsample: children of an unsampled parent are never resurrected, and a child dropped by its rule propagates `parentSampled=false` to its own descendants (documented tree break). Operators whose previously-inert rules now take effect will see child-span export volume drop accordingly; configurations without rules are unchanged.
