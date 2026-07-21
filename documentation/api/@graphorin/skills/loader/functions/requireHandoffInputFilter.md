[**Graphorin API reference v0.13.11**](../../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [loader](/api/@graphorin/skills/loader/index.md) / requireHandoffInputFilter

# Function: requireHandoffInputFilter()

```ts
function requireHandoffInputFilter(metadata): HandoffInputFilterDeclaration;
```

Defined in: packages/skills/src/loader/index.ts:789

**`Stable`**

Required handoff-filter declaration helper. Returns the typed
declaration the loader parsed from frontmatter; throws
[InputFilterRequiredError](/api/@graphorin/skills/errors/classes/InputFilterRequiredError.md) when the skill is untrusted and the
field is missing. Used by the agent runtime in Phase 12 right
before instantiating an untrusted skill's sub-agent.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `metadata` | [`SkillMetadata`](/api/@graphorin/skills/interfaces/SkillMetadata.md) |

## Returns

[`HandoffInputFilterDeclaration`](/api/@graphorin/skills/type-aliases/HandoffInputFilterDeclaration.md)
