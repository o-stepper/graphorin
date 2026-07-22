[**Graphorin API reference v0.15.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DockerodeContainer

# Interface: DockerodeContainer

Defined in: packages/security/src/sandbox/docker.ts:50

**`Stable`**

Structural view of a `dockerode` container instance.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-attach"></a> `attach` | `readonly` | (`opts`) => `Promise`\&lt;`ReadWriteStream`\&gt; | packages/security/src/sandbox/docker.ts:59 |
| <a id="property-id"></a> `id` | `readonly` | `string` | packages/security/src/sandbox/docker.ts:51 |
| <a id="property-logs"></a> `logs` | `readonly` | (`opts`) => `Promise`\<`Buffer`\&lt;`ArrayBufferLike`\&gt; \| `ReadableStream`\> | packages/security/src/sandbox/docker.ts:54 |
| <a id="property-remove"></a> `remove` | `readonly` | (`opts?`) => `Promise`\&lt;`void`\&gt; | packages/security/src/sandbox/docker.ts:58 |
| <a id="property-start"></a> `start` | `readonly` | () => `Promise`\&lt;`void`\&gt; | packages/security/src/sandbox/docker.ts:52 |
| <a id="property-wait"></a> `wait` | `readonly` | () => `Promise`\&lt;\{ `StatusCode`: `number`; \}\&gt; | packages/security/src/sandbox/docker.ts:53 |
