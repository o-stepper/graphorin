[**Graphorin API reference v0.13.11**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DockerodeClient

# Interface: DockerodeClient

Defined in: packages/security/src/sandbox/docker.ts:72

**`Stable`**

Structural view of a `dockerode` client instance.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createcontainer"></a> `createContainer` | `readonly` | (`opts`) => `Promise`\&lt;[`DockerodeContainer`](/api/@graphorin/security/interfaces/DockerodeContainer.md)\&gt; | packages/security/src/sandbox/docker.ts:73 |
| <a id="property-modem"></a> `modem?` | `readonly` | \{ `demuxStream?`: (`raw`, `out`, `err`) => `void`; \} | packages/security/src/sandbox/docker.ts:74 |
| `modem.demuxStream?` | `readonly` | (`raw`, `out`, `err`) => `void` | packages/security/src/sandbox/docker.ts:75 |
