---
'@graphorin/pricing': minor
'@graphorin/cli': minor
---

W-097: `graphorin pricing refresh` finally works against the dataset the docs point at. New pure converter (`convertGenaiPrices` / `isGenaiPricesShape`, exported) maps the published `@pydantic/genai-prices` dataset (providers[] -> models[] -> per-Mtok prices incl. cache read/write legs) into per-token `ModelPrice` entries; unrepresentable model entries (tiered/conditional pricing) are skipped with a counter instead of failing the refresh, and the supported subset is pinned by a vendored fixture + doc comment. `refreshPricing` gains `format: 'auto' | 'graphorin' | 'genai-prices'` (default auto: native first, then detection), stamps converted snapshots `version: 'genai-prices+converted'` with an additive `PricingSnapshot.conversion { format, skipped }`, and REJECTS a dataset declaring a non-USD currency instead of silently stamping dollars. The CLI adds `--format` and prints the skipped count; the pricing reference documents a working raw-URL example. Native-shape refreshes are byte-identical; no baked-in endpoint was added (privacy contract).
