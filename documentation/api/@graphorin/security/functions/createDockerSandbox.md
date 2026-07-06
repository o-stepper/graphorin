[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / createDockerSandbox

# Function: createDockerSandbox()

```ts
function createDockerSandbox(opts?): SandboxImpl;
```

Defined in: [packages/security/src/sandbox/docker.ts:104](https://github.com/o-stepper/graphorin/blob/main/packages/security/src/sandbox/docker.ts#L104)

Construct a `DockerSandbox` instance. The adapter resolves the
peer dependency lazily on the first `run(...)` call.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `opts` | [`DockerSandboxOptions`](/api/@graphorin/security/interfaces/DockerSandboxOptions.md) |

## Returns

[`SandboxImpl`](/api/@graphorin/security/interfaces/SandboxImpl.md)

## Stable
