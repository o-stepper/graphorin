[**Graphorin API reference v0.1.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / WorkerThreadsSandboxOptions

# Interface: WorkerThreadsSandboxOptions

Defined in: packages/security/src/sandbox/worker-threads.ts:58

Options for `createWorkerThreadsSandbox(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-abortgracems"></a> `abortGraceMs?` | `readonly` | `number` | Grace period (ms) after `signal.abort()` before the worker is forcibly terminated. Defaults to 100 ms. | packages/security/src/sandbox/worker-threads.ts:68 |
| <a id="property-defaulttimeoutms"></a> `defaultTimeoutMs?` | `readonly` | `number` | Default wall-clock timeout, in milliseconds. Per-call values from `SandboxRunOptions.timeoutMs` override this default. | packages/security/src/sandbox/worker-threads.ts:63 |
| <a id="property-nofilesystem"></a> `noFilesystem?` | `readonly` | `boolean` | Default block on filesystem access. Per-call values from `SandboxRunOptions.allowFs === false` are honoured first. | packages/security/src/sandbox/worker-threads.ts:78 |
| <a id="property-nonetwork"></a> `noNetwork?` | `readonly` | `boolean` | Default block on outbound network. Per-call values from `SandboxRunOptions.allowNetwork === false` are honoured first. | packages/security/src/sandbox/worker-threads.ts:73 |
| <a id="property-pool"></a> `pool?` | `readonly` | [`WorkerPoolOptions`](/api/@graphorin/security/interfaces/WorkerPoolOptions.md) | Reserved for a post-MVP warm-pool implementation. | packages/security/src/sandbox/worker-threads.ts:82 |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | Optional WARN logger. | packages/security/src/sandbox/worker-threads.ts:80 |
