[**Graphorin API reference v0.13.13**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / IsolatedVMIsolate

# Interface: IsolatedVMIsolate

Defined in: packages/security/src/sandbox/isolated-vm.ts:48

**`Stable`**

Structural view of an `isolated-vm` Isolate instance.

## Properties

| Property | Modifier | Type | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-compilescript"></a> `compileScript` | `readonly` | (`source`) => `Promise`\&lt;[`IsolatedVMScript`](/api/@graphorin/security/interfaces/IsolatedVMScript.md)\&gt; | packages/security/src/sandbox/isolated-vm.ts:50 |
| <a id="property-createcontext"></a> `createContext` | `readonly` | () => `Promise`\&lt;[`IsolatedVMContext`](/api/@graphorin/security/interfaces/IsolatedVMContext.md)\&gt; | packages/security/src/sandbox/isolated-vm.ts:49 |
| <a id="property-dispose"></a> `dispose` | `readonly` | () => `void` | packages/security/src/sandbox/isolated-vm.ts:51 |
