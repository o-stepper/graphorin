[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / CheckPermsOptions

# Interface: CheckPermsOptions

Defined in: [packages/security/src/hardening/doctor.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/doctor.ts#L51)

Options for `checkPerms(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-expected"></a> `expected` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `number`\&gt;\> | Map of path → expected POSIX mode. Each entry is checked against `lstat`. Missing files surface as `'warn'` so the doctor can recommend `graphorin init`. | [packages/security/src/hardening/doctor.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/hardening/doctor.ts#L57) |
