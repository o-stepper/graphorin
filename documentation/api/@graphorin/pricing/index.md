[**Graphorin API reference v0.12.1**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/pricing

# @graphorin/pricing

> Bundled LLM pricing snapshot for the [Graphorin](https://github.com/o-stepper/graphorin) framework.

`@graphorin/pricing` is a tiny dependency-free package that ships a
representative LLM pricing catalogue, a `lookupPrice(...)` resolver, a
snapshot-diff utility, an opt-in `refreshPricing(...)` hook, and the
`listMissingModels(...)` utility used by trace audits.

The package is intentionally separate from `@graphorin/observability`
so consumers can:

- pin the pricing snapshot independently of the framework version,
- ship a custom snapshot without forking the observability package,
- decline the bundled snapshot entirely (just don't import it).

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

const price = lookupPrice({ provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' });
if (price !== null) {
  console.log(`Input: $${price.inputUsdPerToken} / token`);
}

const cost = calculateCost(
  {
    provider: 'openai',
    model: 'gpt-4o-2024-11-20',
    inputTokens: 1_000,
    outputTokens: 500,
  },
  BUNDLED_SNAPSHOT,
);
```

## Refreshing

```ts
import { refreshPricing } from '@graphorin/pricing';
import { writeFile } from 'node:fs/promises';

const snapshot = await refreshPricing({
  url: 'https://example.com/pricing.json',
});
await writeFile('./pricing.json', JSON.stringify(snapshot, null, 2));
```

The framework never invokes `refreshPricing(...)` automatically per
the zero-default-telemetry policy; the operator runs it on demand.

## License

MIT © 2026 [Oleksiy Stepurenko](https://github.com/o-stepper).

---

**Project Graphorin** · v0.12.1 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

## Modules

| Module | Description |
| ------ | ------ |
| [](/api/@graphorin/pricing/README.md) | @graphorin/pricing - bundled LLM pricing snapshot for the Graphorin framework. |
| [package.json](/api/@graphorin/pricing/package.json/index.md) | - |
| [snapshot](/api/@graphorin/pricing/snapshot/index.md) | Bundled pricing snapshot surface. |
