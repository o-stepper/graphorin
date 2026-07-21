[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/server](/api/@graphorin/server/index.md) / [](/api/@graphorin/server/README.md) / HealthCheck

# Type Alias: HealthCheck

```ts
type HealthCheck = 
  | StorageCheck
  | EmbedderCheck
  | SecretsCheck
  | EncryptionCheck
  | ConsolidatorCheck
  | TriggersCheck
  | WorkflowTimersCheck
  | ChannelsCheck
  | ReplayBufferCheck;
```

Defined in: packages/server/src/health/checks.ts:121

**`Stable`**
