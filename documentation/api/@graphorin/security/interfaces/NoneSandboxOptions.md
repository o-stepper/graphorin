[**Graphorin API reference v0.13.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/security](/api/@graphorin/security/index.md) / [](/api/@graphorin/security/README.md) / NoneSandboxOptions

# Interface: NoneSandboxOptions

Defined in: packages/security/src/sandbox/none.ts:48

**`Stable`**

Options for `NoneSandbox`. Hosting code passes a registry of
handlers; lookups are by `module + export` for `'handler'` codes
and by `'inline'` key for `'source'` / `'file'` codes (which the
adapter rejects - directly executing JS source bypasses the trust
tier the user explicitly opted out of).

## Properties

| Property | Modifier | Type | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-resolvehandler"></a> `resolveHandler` | `readonly` | (`code`) => \| [`NoneSandboxHandler`](/api/@graphorin/security/type-aliases/NoneSandboxHandler.md)\&lt;`unknown`, `unknown`\&gt; \| `undefined` | Resolver for `code.kind === 'handler'` invocations. The framework default registers built-in trusted tool handlers at startup. | packages/security/src/sandbox/none.ts:53 |
