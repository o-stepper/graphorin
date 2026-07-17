[**Graphorin API reference v0.10.2**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [errors](/api/@graphorin/skills/errors/index.md) / GraphorinSkillsErrorKind

# Type Alias: GraphorinSkillsErrorKind

```ts
type GraphorinSkillsErrorKind = 
  | "frontmatter:conflict"
  | "manifest:parse"
  | "runtime-compat:mismatch"
  | "frontmatter:missing-required"
  | "handoff:input-filter-required"
  | "load:failed"
  | "registry:name-collision"
  | "slash:parse";
```

Defined in: [packages/skills/src/errors/index.ts:154](https://github.com/o-stepper/graphorin/blob/main/packages/skills/src/errors/index.ts#L154)

Convenience union - every `kind` discriminator the package may emit.
