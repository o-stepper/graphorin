[**Graphorin API reference v0.4.0**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [registry](/api/@graphorin/skills/registry/index.md) / createSkillRegistry

# Function: createSkillRegistry()

```ts
function createSkillRegistry(options?): SkillRegistry;
```

Defined in: packages/skills/src/registry/index.ts:128

Build a fresh, empty registry. Multiple registries can co-exist
within a single process; the framework defaults to a single shared
instance per agent instance.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`SkillRegistryOptions`](/api/@graphorin/skills/registry/interfaces/SkillRegistryOptions.md) |

## Returns

[`SkillRegistry`](/api/@graphorin/skills/registry/interfaces/SkillRegistry.md)

## Stable
