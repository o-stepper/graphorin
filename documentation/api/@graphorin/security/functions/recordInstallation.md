[**Graphorin API reference v0.13.12**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / recordInstallation

# Function: recordInstallation()

```ts
function recordInstallation(status): void;
```

Defined in: packages/security/src/supply-chain/audit.ts:20

**`Stable`**

Record an installation. Called automatically by the npm + git
installers; exposed for tests + custom installers.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `status` | [`SkillInstallationStatus`](/api/@graphorin/security/interfaces/SkillInstallationStatus.md) |

## Returns

`void`
