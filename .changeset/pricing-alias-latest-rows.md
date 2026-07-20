---
'@graphorin/pricing': patch
---

Price the official undated OpenAI aliases and `-latest` ids (ninth deep retest P1). The bundled snapshot gains explicit rows for `gpt-4o`, `gpt-4o-mini`, `o1`, and `o3-mini` at their verified routing targets' rates plus input-billed `text-embedding-3-small`/`text-embedding-3-large` entries; `lookupPrice`/`priceLookupByModel` now strip dashed OpenAI date suffixes (`-2025-04-14`) alongside compact Anthropic ones and resolve `<family>-latest` to the family's dateless entry (or its single retained dated snapshot - two candidates stay null rather than guessing). Previously `priceLookupByModel({ modelId: 'gpt-4o-mini' })` returned `null`, so bench cost ceilings silently could not observe spend for one of the most common judge models.
