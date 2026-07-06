[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/pricing](/api/@graphorin/pricing/index.md) / [](/api/@graphorin/pricing/README.md) / BUNDLED\_SNAPSHOT

# Variable: BUNDLED\_SNAPSHOT

```ts
const BUNDLED_SNAPSHOT: PricingSnapshot;
```

Defined in: [packages/pricing/src/snapshot/bundled.ts:298](https://github.com/o-stepper/graphorin/blob/main/packages/pricing/src/snapshot/bundled.ts#L298)

The bundled snapshot. The `sha256` digest is computed over the
canonical JSON form of `entries` at module load time so consumers
can verify integrity without trusting the package metadata.

## Stable
