[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / AutoCompactionDefault

# Type Alias: AutoCompactionDefault

```ts
type AutoCompactionDefault = "enabled" | "disabled";
```

Defined in: [packages/memory/src/context-engine/compaction/thresholds.ts:88](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/context-engine/compaction/thresholds.ts#L88)

Resolve the default `compaction` mode (ON / OFF) per the active
provider's trust class. Default ON for cloud-tier providers
(`'public-tls' | 'public-mtls'`); default OFF for loopback
(operator owns the failure mode honestly via the manual
`agent.compact()` API).

Returns `'auto'` when the operator did not pass an explicit
config; returns `'enabled'` / `'disabled'` for explicit booleans
the resolver folds into the auto-default.

## Stable
