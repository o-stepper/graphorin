[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / checkPerms

# Function: checkPerms()

```ts
function checkPerms(opts): Promise<CheckResult[]>;
```

Defined in: packages/security/src/hardening/doctor.ts:66

**`Stable`**

Verify that a set of paths carry the expected POSIX modes. Used
by `graphorin doctor --check-perms`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`CheckPermsOptions`](/api/@graphorin/security/interfaces/CheckPermsOptions.md) |

## Returns

`Promise`\&lt;[`CheckResult`](/api/@graphorin/security/interfaces/CheckResult.md)[]\&gt;
