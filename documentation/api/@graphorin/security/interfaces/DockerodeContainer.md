[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DockerodeContainer

# Interface: DockerodeContainer

Defined in: packages/security/src/sandbox/docker.ts:36

**`Stable`**

Structural view of a `dockerode` container instance.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-attach"></a> `attach` | `readonly` | (`opts`) => `Promise`\&lt;`ReadWriteStream`\&gt; | packages/security/src/sandbox/docker.ts:45 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/security/src/sandbox/docker.ts:37 |
| <a id="property-logs"></a> `logs` | `readonly` | (`opts`) => `Promise`\<`Buffer`\&lt;`ArrayBufferLike`\&gt; \| `ReadableStream`\> | packages/security/src/sandbox/docker.ts:40 |
| <a id="property-remove"></a> `remove` | `readonly` | (`opts?`) => `Promise`\&lt;`void`\&gt; | packages/security/src/sandbox/docker.ts:44 |
| <a id="property-start"></a> `start` | `readonly` | () => `Promise`\&lt;`void`\&gt; | packages/security/src/sandbox/docker.ts:38 |
| <a id="property-wait"></a> `wait` | `readonly` | () => `Promise`\&lt;\{ `StatusCode`: `number`; \}\&gt; | packages/security/src/sandbox/docker.ts:39 |
