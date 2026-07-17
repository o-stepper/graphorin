[**Graphorin API reference v0.12.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DockerSandboxOptions

# Interface: DockerSandboxOptions

Defined in: [packages/security/src/sandbox/docker.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/docker.ts#L75)

Options for `createDockerSandbox(...)`.

## Stable

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-defaulttimeoutms"></a> `defaultTimeoutMs?` | `readonly` | `number` | Default wall-clock timeout (ms). Defaults to 30000. | [packages/security/src/sandbox/docker.ts:87](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/docker.ts#L87) |
| <a id="property-image"></a> `image?` | `readonly` | `string` | Container image. Defaults to a no-op stub the operator must override; the framework deliberately does not ship an image. | [packages/security/src/sandbox/docker.ts:80](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/docker.ts#L80) |
| <a id="property-memorylimitmb"></a> `memoryLimitMb?` | `readonly` | `number` | Memory limit (MB). Defaults to 512. | [packages/security/src/sandbox/docker.ts:89](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/docker.ts#L89) |
| <a id="property-peerloader"></a> `peerLoader?` | `readonly` | () => `Promise`\&lt;`DockerodeModule`\&gt; | Override the peer-dep loader. Tests inject a stub here. | [packages/security/src/sandbox/docker.ts:93](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/docker.ts#L93) |
| <a id="property-socketpath"></a> `socketPath?` | `readonly` | `string` | Hostname for the Docker daemon socket. Forwarded to `new Dockerode({ socketPath })`. Defaults to the platform default. | [packages/security/src/sandbox/docker.ts:85](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/docker.ts#L85) |
