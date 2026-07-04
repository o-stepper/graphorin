---
title: Pricing snapshot
description: A bundled, never-auto-refreshed snapshot of LLM pricing data, sourced from the public @pydantic/genai-prices dataset. Refresh on demand with `graphorin pricing refresh`.
---

# Pricing snapshot

`@graphorin/pricing` ships a tiny, dependency-free package with:

- A bundled snapshot of LLM pricing data sourced from [`@pydantic/genai-prices`](https://github.com/pydantic/genai-prices) (MIT).
- A `lookupPrice({ provider, model })` resolver.
- A `calculateCost(spec, usage)` helper.
- An opt-in `refreshPricing(...)` hook (the only network-touching path; never invoked automatically).
- A `listMissingModels(...)` utility used by trace audits.

The package is intentionally separate from `@graphorin/observability` so consumers can pin the pricing snapshot independently of the framework version, ship a custom snapshot without forking the observability package, or decline the bundled snapshot entirely.

## Install

```bash
pnpm add @graphorin/pricing
```

## Quick start

```ts
import {
  BUNDLED_SNAPSHOT,
  calculateCost,
  lookupPrice,
} from '@graphorin/pricing';

const price = lookupPrice({
  provider: 'openai',
  model: 'gpt-4o-2024-11-20',
});

if (price !== null) {
  console.log(`Input: $${price.inputUsdPerToken} / token`);
}

const cost = calculateCost(
  { provider: 'openai', model: 'gpt-4o-2024-11-20' },
  { input: 1200, output: 350 },
);

console.log(`This call costs $${cost.totalUsd.toFixed(6)}.`);
```

## Bundled snapshot

The bundled snapshot is a **point-in-time copy** of the upstream dataset. It is **never automatically refreshed** — Graphorin's privacy contract forbids auto-update and version-ping behaviour.

```ts
import { BUNDLED_SNAPSHOT } from '@graphorin/pricing';

console.log(`Snapshot date: ${BUNDLED_SNAPSHOT.recordedAt}`);
console.log(`Models tracked: ${BUNDLED_SNAPSHOT.models.length}`);
```

## Refreshing on demand

When you want the latest prices, opt in explicitly:

```bash
graphorin pricing refresh --url <snapshot-url>
```

`--url` is required (there is no baked-in refresh endpoint); pass `--out <file>` to persist the refreshed snapshot. Or programmatically:

```ts
import { refreshPricing } from '@graphorin/pricing';

const snapshot = await refreshPricing({ url: 'https://example.com/pricing.json' });
console.log(`Fetched ${snapshot.entries.length} entries.`);
```

`refreshPricing()` is the **only** network-touching code path in `@graphorin/pricing`. The repository's `pnpm run check-no-network` script allow-lists exactly this entry point.

## Diff a refresh

```ts
import { diffPricing, BUNDLED_SNAPSHOT, refreshPricing } from '@graphorin/pricing';

const fresh = await refreshPricing({ url: 'https://example.com/pricing.json' });
const diff = diffPricing(BUNDLED_SNAPSHOT, fresh);
console.log(diff.added, diff.removed, diff.changed);
```

The CLI command `graphorin pricing diff` prints the same diff in human-readable form.

## Listing missing models

When you wire `@graphorin/observability` against a custom provider whose pricing isn't in the snapshot, the trace audit can't compute a cost for those calls. `listMissingModels(...)` enumerates every `(provider, model)` pair the audit saw without a matching price entry — useful for telling you which entries to add to a custom snapshot.

```ts
import { listMissingModels } from '@graphorin/pricing';

const missing = listMissingModels(traceAudit);
for (const { provider, model, count } of missing) {
  console.log(`Missing: ${provider}:${model} (${count} calls)`);
}
```

## Custom snapshots

Pass any `PricingSnapshot` to `lookupPrice` / `calculateCost` to override the bundled defaults:

```ts
import { calculateCost } from '@graphorin/pricing';

const customSnapshot = {
  recordedAt: '2026-05-01',
  models: [
    {
      provider: 'my-vendor',
      model: 'my-model',
      inputUsdPerToken: 0.000_001_2,
      outputUsdPerToken: 0.000_002_4,
    },
  ],
};

const cost = calculateCost(
  { provider: 'my-vendor', model: 'my-model' },
  { input: 5000, output: 800 },
  { snapshot: customSnapshot },
);
```

## Cost telemetry

When `@graphorin/observability` and `@graphorin/pricing` are both installed, the tracer attaches `gen_ai.usage.cost.usd` to every provider span automatically — provided the model is in the active snapshot.

## Privacy

- Bundled snapshot ships **inside** the npm tarball — no first-run download.
- `refreshPricing(...)` is opt-in, idempotent, and audited.
- Cost computation is purely local; no telemetry of pricing decisions ever leaves the process.

## Next steps

- [Providers](/guide/providers) — how the pricing snapshot integrates with the provider middleware.
- [Observability](/guide/observability) — `gen_ai.usage.cost.usd` attribute.
- [CLI](/guide/cli) — `graphorin pricing status / refresh / diff`.

---

**Graphorin** · v0.5.0 · MIT License · © 2026 Oleksiy Stepurenko
