[**Graphorin API reference v0.3.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / configs

# Variable: configs

```ts
const configs: {
  recommended: {
     plugins: readonly ["@graphorin"];
     rules: {
        @graphorin/no-bare-tool-exec: "warn";
        @graphorin/no-implicit-network-call: "error";
        @graphorin/no-secret-in-deps: "error";
        @graphorin/no-secret-unwrap: "error";
        @graphorin/no-third-party-workflow-aliases: "error";
        @graphorin/provider-middleware-order: "error";
        @graphorin/tool-description-required: "error";
        @graphorin/tool-examples-recommended: "warn";
        @graphorin/tool-parameter-naming: "warn";
     };
  };
};
```

Defined in: index.ts:57

## Type Declaration

| Name | Type | Default value | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-recommended"></a> `recommended` | \{ `plugins`: readonly \[`"@graphorin"`\]; `rules`: \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \}; \} | - | index.ts:58 |
| `recommended.plugins` | readonly \[`"@graphorin"`\] | - | index.ts:59 |
| `recommended.rules` | \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \} | - | index.ts:60 |
| `recommended.rules.@graphorin/no-bare-tool-exec` | `"warn"` | `'warn'` | index.ts:61 |
| `recommended.rules.@graphorin/no-implicit-network-call` | `"error"` | `'error'` | index.ts:62 |
| `recommended.rules.@graphorin/no-secret-in-deps` | `"error"` | `'error'` | index.ts:63 |
| `recommended.rules.@graphorin/no-secret-unwrap` | `"error"` | `'error'` | index.ts:64 |
| `recommended.rules.@graphorin/no-third-party-workflow-aliases` | `"error"` | `'error'` | index.ts:65 |
| `recommended.rules.@graphorin/provider-middleware-order` | `"error"` | `'error'` | index.ts:66 |
| `recommended.rules.@graphorin/tool-description-required` | `"error"` | `'error'` | index.ts:67 |
| `recommended.rules.@graphorin/tool-examples-recommended` | `"warn"` | `'warn'` | index.ts:68 |
| `recommended.rules.@graphorin/tool-parameter-naming` | `"warn"` | `'warn'` | index.ts:69 |
