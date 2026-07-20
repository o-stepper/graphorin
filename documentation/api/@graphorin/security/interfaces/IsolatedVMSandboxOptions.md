[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / IsolatedVMSandboxOptions

# Interface: IsolatedVMSandboxOptions

Defined in: packages/security/src/sandbox/isolated-vm.ts:89

**`Stable`**

Options for `createIsolatedVMSandbox(...)`.

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-defaulttimeoutms"></a> `defaultTimeoutMs?` | `readonly` | `number` | Default wall-clock timeout (ms). Defaults to 5000. | packages/security/src/sandbox/isolated-vm.ts:93 |
| <a id="property-fallback"></a> `fallback?` | `readonly` | `"fallback-to-worker-threads"` \| `"throw"` | Adapter to use if the `isolated-vm` peer is unavailable. Defaults to `'fallback-to-worker-threads'`. Set to `'throw'` for production builds that must refuse to start when the peer is missing. | packages/security/src/sandbox/isolated-vm.ts:99 |
| <a id="property-fallbackadapter"></a> `fallbackAdapter?` | `readonly` | [`SandboxImpl`](/api/@graphorin/security/interfaces/SandboxImpl.md) | Worker-threads adapter to fall back to. Required when `fallback === 'fallback-to-worker-threads'`. | packages/security/src/sandbox/isolated-vm.ts:101 |
| <a id="property-memorylimitmb"></a> `memoryLimitMb?` | `readonly` | `number` | Memory limit forwarded to `new Isolate({ memoryLimit })`. Defaults to 128 MB per DEC-148. | packages/security/src/sandbox/isolated-vm.ts:91 |
| <a id="property-peerloader"></a> `peerLoader?` | `readonly` | () => `Promise`\&lt;[`IsolatedVMPeerModule`](/api/@graphorin/security/interfaces/IsolatedVMPeerModule.md)\&gt; | Override the peer-dep loader. Tests pass a stub here so the adapter can run without the native binary. | packages/security/src/sandbox/isolated-vm.ts:108 |
| <a id="property-warn"></a> `warn?` | `readonly` | (`message`) => `void` | Optional WARN logger called once per process when the fallback engages. | packages/security/src/sandbox/isolated-vm.ts:103 |
