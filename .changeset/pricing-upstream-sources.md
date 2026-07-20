---
'@graphorin/pricing': patch
---

Pricing provenance now carries the full chain: `PricingSnapshot` and `LookupPriceResult` gained an optional `upstreamSources` list naming the original pricing authorities (provider pricing pages, refresh datasets) alongside the existing `source` artifact link. The bundled snapshot declares the Anthropic and OpenAI pricing pages; `refreshPricing(...)` declares its fetch URL.
