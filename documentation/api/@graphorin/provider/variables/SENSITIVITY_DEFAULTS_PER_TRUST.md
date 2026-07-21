[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/provider](/api/@graphorin/provider/index.md) / [](/api/@graphorin/provider/README.md) / SENSITIVITY\_DEFAULTS\_PER\_TRUST

# Variable: SENSITIVITY\_DEFAULTS\_PER\_TRUST

```ts
const SENSITIVITY_DEFAULTS_PER_TRUST: Readonly<Record<LocalProviderTrust, ReadonlyArray<Sensitivity>>>;
```

Defined in: packages/provider/src/trust/classify-local-provider.ts:46

**`Stable`**

Per-tier default sensitivity envelope. Lifted to a constant so
downstream code (and tests) can import it without re-deriving the
matrix.
