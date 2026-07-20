[**Graphorin API reference v0.13.7**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / BUNDLED\_SNAPSHOT

# Variable: BUNDLED\_SNAPSHOT

```ts
const BUNDLED_SNAPSHOT: PricingSnapshot;
```

Defined in: pricing/src/snapshot/bundled.ts:341

**`Stable`**

The bundled snapshot. The `sha256` digest is computed over the
canonical JSON form of `entries` at module load time so consumers
can verify integrity without trusting the package metadata.
