[**Graphorin API reference v0.10.2**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / auditInstalledSkills

# Function: auditInstalledSkills()

```ts
function auditInstalledSkills(): readonly SkillInstallationStatus[];
```

Defined in: [packages/security/src/supply-chain/audit.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/audit.ts#L30)

Snapshot of every installation recorded in this process. Returns a
fresh frozen array so callers cannot mutate the registry.

## Returns

readonly [`SkillInstallationStatus`](/api/@graphorin/security/interfaces/SkillInstallationStatus.md)[]

## Stable
