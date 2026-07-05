[**Graphorin API reference v0.6.1**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / [](/api/@graphorin/eslint-plugin/README.md) / configs

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

Defined in: src/index.ts:98

## Type Declaration

| Name | Type | Default value | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-flatrecommended"></a> `flat/recommended` | \{ `plugins`: `Record`\&lt;`string`, `unknown`\&gt;; `rules`: \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \}; \} | - | src/index.ts:81 |
| `flat/recommended.plugins` | `Record`\&lt;`string`, `unknown`\&gt; | - | src/index.ts:82 |
| `flat/recommended.rules` | \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \} | - | src/index.ts:83 |
| `flat/recommended.rules.@graphorin/no-bare-tool-exec` | `"warn"` | `'warn'` | src/index.ts:56 |
| `flat/recommended.rules.@graphorin/no-implicit-network-call` | `"error"` | `'error'` | src/index.ts:57 |
| `flat/recommended.rules.@graphorin/no-secret-in-deps` | `"error"` | `'error'` | src/index.ts:58 |
| `flat/recommended.rules.@graphorin/no-secret-unwrap` | `"error"` | `'error'` | src/index.ts:59 |
| `flat/recommended.rules.@graphorin/no-third-party-workflow-aliases` | `"error"` | `'error'` | src/index.ts:60 |
| `flat/recommended.rules.@graphorin/provider-middleware-order` | `"error"` | `'error'` | src/index.ts:61 |
| `flat/recommended.rules.@graphorin/tool-description-required` | `"error"` | `'error'` | src/index.ts:62 |
| `flat/recommended.rules.@graphorin/tool-examples-recommended` | `"warn"` | `'warn'` | src/index.ts:63 |
| `flat/recommended.rules.@graphorin/tool-parameter-naming` | `"warn"` | `'warn'` | src/index.ts:64 |
| <a id="property-recommended"></a> `recommended` | \{ `plugins`: readonly `string`[]; `rules`: \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \}; \} | - | src/index.ts:77 |
| `recommended.plugins` | readonly `string`[] | - | src/index.ts:78 |
| `recommended.rules` | \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \} | - | src/index.ts:79 |
| `recommended.rules.@graphorin/no-bare-tool-exec` | `"warn"` | `'warn'` | src/index.ts:56 |
| `recommended.rules.@graphorin/no-implicit-network-call` | `"error"` | `'error'` | src/index.ts:57 |
| `recommended.rules.@graphorin/no-secret-in-deps` | `"error"` | `'error'` | src/index.ts:58 |
| `recommended.rules.@graphorin/no-secret-unwrap` | `"error"` | `'error'` | src/index.ts:59 |
| `recommended.rules.@graphorin/no-third-party-workflow-aliases` | `"error"` | `'error'` | src/index.ts:60 |
| `recommended.rules.@graphorin/provider-middleware-order` | `"error"` | `'error'` | src/index.ts:61 |
| `recommended.rules.@graphorin/tool-description-required` | `"error"` | `'error'` | src/index.ts:62 |
| `recommended.rules.@graphorin/tool-examples-recommended` | `"warn"` | `'warn'` | src/index.ts:63 |
| `recommended.rules.@graphorin/tool-parameter-naming` | `"warn"` | `'warn'` | src/index.ts:64 |
