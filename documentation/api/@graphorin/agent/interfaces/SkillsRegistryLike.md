[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/agent](/api/@graphorin/agent/index.md) / [](/api/@graphorin/agent/README.md) / SkillsRegistryLike

# Interface: SkillsRegistryLike

Defined in: [packages/agent/src/types.ts:125](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L125)

Skill-registry shape consumed by the agent loop. Implementations
live in `@graphorin/skills`. We accept any structurally-compatible
value to avoid the heavyweight peer dependency on the typing
surface.

## Stable

## Methods

### list()?

```ts
optional list(): readonly unknown[];
```

Defined in: [packages/agent/src/types.ts:126](https://github.com/o-stepper/graphorin/blob/main/packages/agent/src/types.ts#L126)

#### Returns

readonly `unknown`[]
