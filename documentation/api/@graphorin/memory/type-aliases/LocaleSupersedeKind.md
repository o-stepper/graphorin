[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/memory](/api/@graphorin/memory/index.md) / [](/api/@graphorin/memory/README.md) / LocaleSupersedeKind

# Type Alias: LocaleSupersedeKind

```ts
type LocaleSupersedeKind = "location" | "job" | "preference" | "relationship" | "health" | "generic";
```

Defined in: [packages/memory/src/conflict/locale-packs/types.ts:16](https://github.com/o-stepper/graphorin/blob/main/packages/memory/src/conflict/locale-packs/types.ts#L16)

Categorisation of a supersede marker. Surfaced on the audit row so
downstream tooling can group conflicts by lifecycle event
(relocation / job / preference / relationship / health / generic).

## Stable
