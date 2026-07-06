[**Graphorin API reference v0.6.1**](../../../index.md)

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

Defined in: [packages/security/dist/supply-chain/types.d.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/security/dist/supply-chain/types.d.ts#L30)

Source descriptor for a skill installation request.

## Stable
