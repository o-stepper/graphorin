[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / recordInstallation

# Function: recordInstallation()

```ts
function recordInstallation(status): void;
```

Defined in: [packages/security/src/supply-chain/audit.ts:20](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/supply-chain/audit.ts#L20)

Record an installation. Called automatically by the npm + git
installers; exposed for tests + custom installers.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `status` | [`SkillInstallationStatus`](/api/@graphorin/security/interfaces/SkillInstallationStatus.md) |

## Returns

`void`

## Stable
