[**Graphorin API reference v0.6.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / configs

# Variable: configs

```ts
const configs: {
  flat/recommended: {
     plugins: Record<string, unknown>;
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
  recommended: {
     plugins: readonly string[];
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
} = plugin.configs;
```

Defined in: index.ts:97

## Type Declaration

| Name | Type | Default value | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-flatrecommended"></a> `flat/recommended` | \{ `plugins`: `Record`\&lt;`string`, `unknown`\&gt;; `rules`: \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \}; \} | - | index.ts:80 |
| `flat/recommended.plugins` | `Record`\&lt;`string`, `unknown`\&gt; | - | index.ts:81 |
| `flat/recommended.rules` | \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \} | - | index.ts:82 |
| `flat/recommended.rules.@graphorin/no-bare-tool-exec` | `"warn"` | `'warn'` | index.ts:55 |
| `flat/recommended.rules.@graphorin/no-implicit-network-call` | `"error"` | `'error'` | index.ts:56 |
| `flat/recommended.rules.@graphorin/no-secret-in-deps` | `"error"` | `'error'` | index.ts:57 |
| `flat/recommended.rules.@graphorin/no-secret-unwrap` | `"error"` | `'error'` | index.ts:58 |
| `flat/recommended.rules.@graphorin/no-third-party-workflow-aliases` | `"error"` | `'error'` | index.ts:59 |
| `flat/recommended.rules.@graphorin/provider-middleware-order` | `"error"` | `'error'` | index.ts:60 |
| `flat/recommended.rules.@graphorin/tool-description-required` | `"error"` | `'error'` | index.ts:61 |
| `flat/recommended.rules.@graphorin/tool-examples-recommended` | `"warn"` | `'warn'` | index.ts:62 |
| `flat/recommended.rules.@graphorin/tool-parameter-naming` | `"warn"` | `'warn'` | index.ts:63 |
| <a id="property-recommended"></a> `recommended` | \{ `plugins`: readonly `string`[]; `rules`: \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \}; \} | - | index.ts:76 |
| `recommended.plugins` | readonly `string`[] | - | index.ts:77 |
| `recommended.rules` | \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \} | - | index.ts:78 |
| `recommended.rules.@graphorin/no-bare-tool-exec` | `"warn"` | `'warn'` | index.ts:55 |
| `recommended.rules.@graphorin/no-implicit-network-call` | `"error"` | `'error'` | index.ts:56 |
| `recommended.rules.@graphorin/no-secret-in-deps` | `"error"` | `'error'` | index.ts:57 |
| `recommended.rules.@graphorin/no-secret-unwrap` | `"error"` | `'error'` | index.ts:58 |
| `recommended.rules.@graphorin/no-third-party-workflow-aliases` | `"error"` | `'error'` | index.ts:59 |
| `recommended.rules.@graphorin/provider-middleware-order` | `"error"` | `'error'` | index.ts:60 |
| `recommended.rules.@graphorin/tool-description-required` | `"error"` | `'error'` | index.ts:61 |
| `recommended.rules.@graphorin/tool-examples-recommended` | `"warn"` | `'warn'` | index.ts:62 |
| `recommended.rules.@graphorin/tool-parameter-naming` | `"warn"` | `'warn'` | index.ts:63 |
