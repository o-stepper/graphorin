[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / SkillSource

# Type Alias: SkillSource

```ts
type SkillSource = 
  | {
  kind: "folder";
  path: string;
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

Source descriptor for a [loadSkills](/api/@graphorin/skills/loader/functions/loadSkills.md) request.

- `'folder'`      — load from a directory on disk.
- `'npm-package'` — install via the supply-chain installer + load.
- `'git-repo'`    — shallow-clone via the supply-chain installer +
  load.
- `'inline'`      — the caller supplies a parsed skill structure;
  useful for tests and embedded fixtures.

## Stable
