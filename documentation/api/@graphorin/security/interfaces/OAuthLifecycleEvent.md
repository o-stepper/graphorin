[**Graphorin API reference v0.10.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / OAuthLifecycleEvent

# Interface: OAuthLifecycleEvent

Defined in: [packages/security/src/oauth/events.ts:28](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/events.ts#L28)

Lifecycle event payload. Intentionally minimal so the framework can
keep the same shape across consumers.

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-metadata"></a> `metadata?` | `readonly` | `Readonly`\<`Record`\&lt;`string`, `unknown`\&gt;\> | [packages/security/src/oauth/events.ts:33](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/events.ts#L33) |
| <a id="property-reason"></a> `reason?` | `readonly` | `string` | [packages/security/src/oauth/events.ts:32](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/events.ts#L32) |
| <a id="property-serverid"></a> `serverId` | `readonly` | `string` | [packages/security/src/oauth/events.ts:30](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/events.ts#L30) |
| <a id="property-ts"></a> `ts` | `readonly` | `number` | [packages/security/src/oauth/events.ts:31](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/events.ts#L31) |
| <a id="property-type"></a> `type` | `readonly` | [`OAuthLifecycleEventName`](/api/@graphorin/security/type-aliases/OAuthLifecycleEventName.md) | [packages/security/src/oauth/events.ts:29](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/oauth/events.ts#L29) |
