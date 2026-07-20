[**Graphorin API reference v0.13.5**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / DockerodeClient

# Interface: DockerodeClient

Defined in: packages/security/src/sandbox/docker.ts:58

**`Stable`**

Structural view of a `dockerode` client instance.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-createcontainer"></a> `createContainer` | `readonly` | (`opts`) => `Promise`\&lt;[`DockerodeContainer`](/api/@graphorin/security/interfaces/DockerodeContainer.md)\&gt; | packages/security/src/sandbox/docker.ts:59 |
| <a id="property-modem"></a> `modem?` | `readonly` | \{ `demuxStream?`: (`raw`, `out`, `err`) => `void`; \} | packages/security/src/sandbox/docker.ts:60 |
| `modem.demuxStream?` | `readonly` | (`raw`, `out`, `err`) => `void` | packages/security/src/sandbox/docker.ts:61 |
