[**Graphorin API reference v0.12.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / AuthBridgeTeardown

# Interface: AuthBridgeTeardown()

Defined in: [packages/security/src/audit/auth-bridge.ts:23](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/auth-bridge.ts#L23)

Teardown returned by `bridgeAuthToAudit(...)`.

## Stable

```ts
AuthBridgeTeardown(): void;
```

Defined in: [packages/security/src/audit/auth-bridge.ts:24](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/auth-bridge.ts#L24)

Teardown returned by `bridgeAuthToAudit(...)`.

## Returns

`void`

## Stable

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-drain"></a> `drain` | `readonly` | () => `Promise`\&lt;`void`\&gt; | [packages/security/src/audit/auth-bridge.ts:25](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/audit/auth-bridge.ts#L25) |
