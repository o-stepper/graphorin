[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / SkillsRegistryLike

# Interface: SkillsRegistryLike

Defined in: packages/agent/src/types.ts:125

**`Stable`**

Skill-registry shape consumed by the agent loop. Implementations
live in `@graphorin/skills`. We accept any structurally-compatible
value to avoid the heavyweight peer dependency on the typing
surface.

## Methods

### list()?

```ts
optional list(): readonly unknown[];
```

Defined in: packages/agent/src/types.ts:126

#### Returns

readonly `unknown`[]
