[**Graphorin API reference v0.14.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DockerSandboxOptions

# Interface: DockerSandboxOptions

Defined in: packages/security/src/sandbox/docker.ts:105

**`Stable`**

Options for `createDockerSandbox(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-cpus"></a> `cpus?` | `readonly` | `number` | CPU allowance in CPUs (`NanoCpus`), fractional allowed. Bounds busy-loop burn. Defaults to 1; clamped to `[0.1, 8]`. | packages/security/src/sandbox/docker.ts:139 |
| <a id="property-defaulttimeoutms"></a> `defaultTimeoutMs?` | `readonly` | `number` | Default wall-clock timeout (ms). Defaults to 30000. | packages/security/src/sandbox/docker.ts:117 |
| <a id="property-image"></a> `image?` | `readonly` | `string` | Container image. Defaults to a no-op stub the operator must override; the framework deliberately does not ship an image. | packages/security/src/sandbox/docker.ts:110 |
| <a id="property-memorylimitmb"></a> `memoryLimitMb?` | `readonly` | `number` | Memory limit (MB). Defaults to 512. | packages/security/src/sandbox/docker.ts:119 |
| <a id="property-peerloader"></a> `peerLoader?` | `readonly` | () => `Promise`\&lt;[`DockerodeModule`](/api/@graphorin/security/interfaces/DockerodeModule.md)\&gt; | Override the peer-dep loader. Tests inject a stub here. | packages/security/src/sandbox/docker.ts:143 |
| <a id="property-pidslimit"></a> `pidsLimit?` | `readonly` | `number` | PID ceiling for the container (`PidsLimit`) - bounds fork/spawn storms that would otherwise run until the timeout. Defaults to 128; clamped to `[16, 4096]`. | packages/security/src/sandbox/docker.ts:134 |
| <a id="property-socketpath"></a> `socketPath?` | `readonly` | `string` | Hostname for the Docker daemon socket. Forwarded to `new Dockerode({ socketPath })`. Defaults to the platform default. | packages/security/src/sandbox/docker.ts:115 |
| <a id="property-user"></a> `user?` | `readonly` | `string` | Container user as `"uid:gid"` (the create request's `User`). Defaults to `'10001:10001'` so sandboxed code never runs as the image's default user - which is root in most base images (deep-retest 0.13.12 P2). Numeric ids need no passwd entry. Pass `''` to keep the image default (NOT recommended; document why in your deployment notes if you do). | packages/security/src/sandbox/docker.ts:128 |
