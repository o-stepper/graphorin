[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / SkillSource

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
  version?: string;
}
  | {
  kind: "git-repo";
  ref?: string;
  url: string;
};
```

Defined in: packages/security/src/supply-chain/types.ts:31

**`Stable`**

Source descriptor for a skill installation request.
