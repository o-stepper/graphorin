---
'@graphorin/pricing': patch
---

Accept the published bare top-level array form of the genai-prices dataset (E-09, N-03/18): the live `data.json` from `pydantic/genai-prices` ships as a top-level ARRAY of provider objects, which `isGenaiPricesShape` rejected, so the documented `graphorin pricing refresh --url <data.json>` example failed (with the misleading native `missing provider / model` error in auto mode). Both `isGenaiPricesShape` and `convertGenaiPrices` now normalize `Array.isArray(body) ? { providers: body } : body` (elements must still carry `models` arrays, so native `ModelPrice[]` bodies keep taking the native path), and the shape-mismatch error names both accepted forms. Adds bare-array regression tests mirroring the live upstream shape.
