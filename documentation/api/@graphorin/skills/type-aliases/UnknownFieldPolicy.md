[**Graphorin API reference v0.13.6**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / UnknownFieldPolicy

# Type Alias: UnknownFieldPolicy

```ts
type UnknownFieldPolicy = "preserve" | "reject" | "warn";
```

Defined in: packages/skills/src/types/index.ts:49

**`Stable`**

Policy applied to frontmatter fields that are present but recognised
neither by the bundled spec snapshot nor by the `graphorin-*`
extension catalogue.
