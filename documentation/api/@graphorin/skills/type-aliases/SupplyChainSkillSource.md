[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/skills](/api/@graphorin/skills/index.md) / [](/api/@graphorin/skills/README.md) / SupplyChainSkillSource

# Type Alias: SupplyChainSkillSource

```ts
type SupplyChainSkillSource = 
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

Defined in: [packages/security/dist/supply-chain/types.d.ts](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts)

**`Stable`**

Source descriptor for a skill installation request.
