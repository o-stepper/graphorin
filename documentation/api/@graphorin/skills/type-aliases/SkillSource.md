[**Graphorin API reference v0.13.3**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / SkillSource

# Type Alias: SkillSource

```ts
type SkillSource = 
  | {
  kind: "folder";
  path: string;
  trustLevel?: SkillTrustLevel;
}
  | {
  kind: "npm-package";
  packageName: string;
  trustLevel?: SkillTrustLevel;
  version?: string;
}
  | {
  kind: "git-repo";
  ref?: string;
  trustLevel?: SkillTrustLevel;
  url: string;
}
  | {
  kind: "inline";
  skill: InlineSkill;
};
```

Defined in: packages/skills/src/types/index.ts:72

**`Stable`**

Source descriptor for a [loadSkills](/api/@graphorin/skills/loader/functions/loadSkills.md) request.

- `'folder'`      - load from a directory on disk.
- `'npm-package'` - install via the supply-chain installer + load.
- `'git-repo'`    - shallow-clone via the supply-chain installer +
  load.
- `'inline'`      - the caller supplies a parsed skill structure;
  useful for tests and embedded fixtures.

## Union Members

### Type Literal

```ts
{
  kind: "folder";
  path: string;
  trustLevel?: SkillTrustLevel;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `kind` | `"folder"` | - | packages/skills/src/types/index.ts:74 |
| `path` | `string` | - | packages/skills/src/types/index.ts:75 |
| `trustLevel?` | [`SkillTrustLevel`](/api/@graphorin/skills/type-aliases/SkillTrustLevel.md) | Operator-supplied trust level. When present it overrides the skill's self-declared `graphorin-trust-level`. Without it, a folder's self-declared `trusted` / `trusted-with-scripts` is capped at `'unknown'` - a downloaded directory cannot promote itself; trust is granted by the integrator, never the artifact. | packages/skills/src/types/index.ts:83 |

***

### Type Literal

```ts
{
  kind: "npm-package";
  packageName: string;
  trustLevel?: SkillTrustLevel;
  version?: string;
}
```

***

### Type Literal

```ts
{
  kind: "git-repo";
  ref?: string;
  trustLevel?: SkillTrustLevel;
  url: string;
}
```

***

### Type Literal

```ts
{
  kind: "inline";
  skill: InlineSkill;
}
```
