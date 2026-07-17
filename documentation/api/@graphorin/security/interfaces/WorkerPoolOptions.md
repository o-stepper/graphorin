[**Graphorin API reference v0.11.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / WorkerPoolOptions

# Interface: WorkerPoolOptions

Defined in: [packages/security/src/sandbox/worker-threads.ts:51](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/worker-threads.ts#L51)

Worker pool sizing options. Reserved for the post-MVP warm-pool
implementation; the v0.1 adapter spawns a fresh worker per call.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-idletimeoutms"></a> `idleTimeoutMs?` | `readonly` | `number` | [packages/security/src/sandbox/worker-threads.ts:54](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/worker-threads.ts#L54) |
| <a id="property-max"></a> `max?` | `readonly` | `number` | [packages/security/src/sandbox/worker-threads.ts:53](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/worker-threads.ts#L53) |
| <a id="property-min"></a> `min?` | `readonly` | `number` | [packages/security/src/sandbox/worker-threads.ts:52](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/worker-threads.ts#L52) |
