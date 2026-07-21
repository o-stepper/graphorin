[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / installSkillFromGit

# Function: installSkillFromGit()

```ts
function installSkillFromGit(options): Promise<SkillInstallationStatus>;
```

Defined in: packages/security/src/supply-chain/installer.ts:229

**`Stable`**

Install a skill from a git repository (shallow clone). The
resulting clone lives in the OS temp directory; consumers are
responsible for cleanup.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`InstallSkillFromGitOptions`](/api/@graphorin/security/interfaces/InstallSkillFromGitOptions.md) |

## Returns

`Promise`\&lt;[`SkillInstallationStatus`](/api/@graphorin/security/interfaces/SkillInstallationStatus.md)\&gt;
