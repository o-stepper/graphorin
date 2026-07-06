---
'@graphorin/server': minor
---

`POST /v1/tokens` enforces attenuation-only minting (W-106): a token principal can only mint scopes its own grant covers (`scopeMatches` semantics - `admin:*` covers all, two-segment grants cover three-segment requests, never the reverse), answering `403 scope-escalation-denied` with the uncovered list otherwise; delegation chains narrow monotonically since the child's `tokens:create` must itself be covered. Syntactically invalid requested scopes now answer `400` instead of minting a token that grants nothing. Integrations that minted wider tokens through a bare `tokens:create` service token must grant the minter the full target set (or `admin:*`). The anonymous trusted-loopback operator (auth disabled) is exempt; the CLI path is unaffected.
