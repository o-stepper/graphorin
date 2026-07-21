[**Graphorin API reference v0.13.9**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DockerSandboxOptions

# Interface: DockerSandboxOptions

Defined in: packages/security/src/sandbox/docker.ts:105

**`Stable`**

Options for `createDockerSandbox(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-defaulttimeoutms"></a> `defaultTimeoutMs?` | `readonly` | `number` | Default wall-clock timeout (ms). Defaults to 30000. | packages/security/src/sandbox/docker.ts:117 |
| <a id="property-image"></a> `image?` | `readonly` | `string` | Container image. Defaults to a no-op stub the operator must override; the framework deliberately does not ship an image. | packages/security/src/sandbox/docker.ts:110 |
| <a id="property-memorylimitmb"></a> `memoryLimitMb?` | `readonly` | `number` | Memory limit (MB). Defaults to 512. | packages/security/src/sandbox/docker.ts:119 |
| <a id="property-peerloader"></a> `peerLoader?` | `readonly` | () => `Promise`\&lt;[`DockerodeModule`](/api/@graphorin/security/interfaces/DockerodeModule.md)\&gt; | Override the peer-dep loader. Tests inject a stub here. | packages/security/src/sandbox/docker.ts:123 |
| <a id="property-socketpath"></a> `socketPath?` | `readonly` | `string` | Hostname for the Docker daemon socket. Forwarded to `new Dockerode({ socketPath })`. Defaults to the platform default. | packages/security/src/sandbox/docker.ts:115 |
