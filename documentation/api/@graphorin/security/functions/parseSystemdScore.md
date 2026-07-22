[**Graphorin API reference v0.15.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / parseSystemdScore

# Function: parseSystemdScore()

```ts
function parseSystemdScore(output): number | undefined;
```

Defined in: packages/security/src/hardening/doctor.ts:293

**`Stable`**

Parse the score line from `systemd-analyze security`. The line
normally looks like `→ Overall exposure level for ...: 7.4 OK`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `output` | `string` |

## Returns

`number` \| `undefined`
