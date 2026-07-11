[**Graphorin API reference v0.8.0**](../../../index.md)

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

Defined in: [packages/security/src/supply-chain/types.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/types.ts#L31)

Source descriptor for a skill installation request.

## Stable
