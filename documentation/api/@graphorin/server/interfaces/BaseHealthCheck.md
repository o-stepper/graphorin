[**Graphorin API reference v0.8.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / BaseHealthCheck

# Interface: BaseHealthCheck

Defined in: [packages/server/src/health/checks.ts:42](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L42)

Common discriminator carried on every per-subsystem check entry.
Concrete shapes extend this with subsystem-specific fields per the
documented contract.

## Stable

## Extended by

- [`ChannelsCheck`](/api/@graphorin/server/interfaces/ChannelsCheck.md)
- [`ConsolidatorCheck`](/api/@graphorin/server/interfaces/ConsolidatorCheck.md)
- [`EmbedderCheck`](/api/@graphorin/server/interfaces/EmbedderCheck.md)
- [`EncryptionCheck`](/api/@graphorin/server/interfaces/EncryptionCheck.md)
- [`ReplayBufferCheck`](/api/@graphorin/server/interfaces/ReplayBufferCheck.md)
- [`SecretsCheck`](/api/@graphorin/server/interfaces/SecretsCheck.md)
- [`StorageCheck`](/api/@graphorin/server/interfaces/StorageCheck.md)
- [`TriggersCheck`](/api/@graphorin/server/interfaces/TriggersCheck.md)

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-message"></a> `message?` | `readonly` | `string` | [packages/server/src/health/checks.ts:44](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L44) |
| <a id="property-status"></a> `status` | `readonly` | [`HealthStatus`](/api/@graphorin/server/type-aliases/HealthStatus.md) | [packages/server/src/health/checks.ts:43](https://github.com/o-stepper/graphorin/blob/main/packages/server/src/health/checks.ts#L43) |
