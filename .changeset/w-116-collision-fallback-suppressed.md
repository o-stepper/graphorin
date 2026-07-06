---
'@graphorin/tools': minor
---

W-116: an auto-prefix collision loser can no longer vanish silently. `autoPrefix` now (1) falls back to a deterministic `<kind>-<hash>` namespace when the sanitised source identity is empty (e.g. an MCP serverIdentity made of non-alphanumerics), and (2) truncates an over-128-char candidate to the limit with a hash suffix instead of refusing the rename - so a typical loser is ALWAYS uniquely renamed. For the residual cases (a rename target already occupied - which previously minted a fresh, unprocessed collision - or a pathological unrenameable source) the loser is dropped OBSERVABLY: a new additive `CollisionResolution` variant `{ action: 'suppressed' }`, a `tool:collision:suppressed` audit event (decision `denied`) and the `tool.collision.suppressed.total` counter. Existing auto-prefix outcomes for normal namespaces are byte-identical.
