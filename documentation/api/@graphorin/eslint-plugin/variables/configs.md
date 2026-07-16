[**Graphorin API reference v0.10.1**](../../../index.md)

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

Defined in: [packages/eslint-plugin/src/index.ts:98](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L98)

## Type Declaration

| Name | Type | Default value | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-flatrecommended"></a> `flat/recommended` | \{ `plugins`: `Record`\&lt;`string`, `unknown`\&gt;; `rules`: \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \}; \} | - | [packages/eslint-plugin/src/index.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L81) |
| `flat/recommended.plugins` | `Record`\&lt;`string`, `unknown`\&gt; | - | [packages/eslint-plugin/src/index.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L82) |
| `flat/recommended.rules` | \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \} | - | [packages/eslint-plugin/src/index.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L83) |
| `flat/recommended.rules.@graphorin/no-bare-tool-exec` | `"warn"` | `'warn'` | [packages/eslint-plugin/src/index.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L56) |
| `flat/recommended.rules.@graphorin/no-implicit-network-call` | `"error"` | `'error'` | [packages/eslint-plugin/src/index.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L57) |
| `flat/recommended.rules.@graphorin/no-secret-in-deps` | `"error"` | `'error'` | [packages/eslint-plugin/src/index.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L58) |
| `flat/recommended.rules.@graphorin/no-secret-unwrap` | `"error"` | `'error'` | [packages/eslint-plugin/src/index.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L59) |
| `flat/recommended.rules.@graphorin/no-third-party-workflow-aliases` | `"error"` | `'error'` | [packages/eslint-plugin/src/index.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L60) |
| `flat/recommended.rules.@graphorin/provider-middleware-order` | `"error"` | `'error'` | [packages/eslint-plugin/src/index.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L61) |
| `flat/recommended.rules.@graphorin/tool-description-required` | `"error"` | `'error'` | [packages/eslint-plugin/src/index.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L62) |
| `flat/recommended.rules.@graphorin/tool-examples-recommended` | `"warn"` | `'warn'` | [packages/eslint-plugin/src/index.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L63) |
| `flat/recommended.rules.@graphorin/tool-parameter-naming` | `"warn"` | `'warn'` | [packages/eslint-plugin/src/index.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L64) |
| <a id="property-recommended"></a> `recommended` | \{ `plugins`: readonly `string`[]; `rules`: \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \}; \} | - | [packages/eslint-plugin/src/index.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L77) |
| `recommended.plugins` | readonly `string`[] | - | [packages/eslint-plugin/src/index.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L78) |
| `recommended.rules` | \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \} | - | [packages/eslint-plugin/src/index.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L79) |
| `recommended.rules.@graphorin/no-bare-tool-exec` | `"warn"` | `'warn'` | [packages/eslint-plugin/src/index.ts:56](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L56) |
| `recommended.rules.@graphorin/no-implicit-network-call` | `"error"` | `'error'` | [packages/eslint-plugin/src/index.ts:57](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L57) |
| `recommended.rules.@graphorin/no-secret-in-deps` | `"error"` | `'error'` | [packages/eslint-plugin/src/index.ts:58](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L58) |
| `recommended.rules.@graphorin/no-secret-unwrap` | `"error"` | `'error'` | [packages/eslint-plugin/src/index.ts:59](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L59) |
| `recommended.rules.@graphorin/no-third-party-workflow-aliases` | `"error"` | `'error'` | [packages/eslint-plugin/src/index.ts:60](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L60) |
| `recommended.rules.@graphorin/provider-middleware-order` | `"error"` | `'error'` | [packages/eslint-plugin/src/index.ts:61](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L61) |
| `recommended.rules.@graphorin/tool-description-required` | `"error"` | `'error'` | [packages/eslint-plugin/src/index.ts:62](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L62) |
| `recommended.rules.@graphorin/tool-examples-recommended` | `"warn"` | `'warn'` | [packages/eslint-plugin/src/index.ts:63](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L63) |
| `recommended.rules.@graphorin/tool-parameter-naming` | `"warn"` | `'warn'` | [packages/eslint-plugin/src/index.ts:64](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L64) |
