[**Graphorin API reference v0.13.4**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / [](/api/@graphorin/eslint-plugin/README.md) / default

# Variable: default

```ts
const default: {
  configs: {
     flat/recommended: {
        plugins: Record<string, unknown>;
        rules: typeof RECOMMENDED_RULES;
     };
     recommended: {
        plugins: readonly string[];
        rules: typeof RECOMMENDED_RULES;
     };
  };
  meta: typeof meta;
  rules: typeof rules;
};
```

Defined in: src/index.ts:78

Ship BOTH config shapes. `recommended` is the legacy `.eslintrc` form
(`plugins: ['@graphorin']`); `flat/recommended` is the ESLint 9+ flat-config
form that maps the namespace to the plugin object, so flat-config consumers
can `...plugin.configs['flat/recommended']` instead of hand-wiring ten rules.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-configs"></a> `configs` | \{ `flat/recommended`: \{ `plugins`: `Record`\&lt;`string`, `unknown`\&gt;; `rules`: *typeof* [`RECOMMENDED_RULES`](/api/@graphorin/eslint-plugin/variables/RECOMMENDED_RULES.md); \}; `recommended`: \{ `plugins`: readonly `string`[]; `rules`: *typeof* [`RECOMMENDED_RULES`](/api/@graphorin/eslint-plugin/variables/RECOMMENDED_RULES.md); \}; \} | src/index.ts:81 |
| `configs.flat/recommended` | \{ `plugins`: `Record`\&lt;`string`, `unknown`\&gt;; `rules`: *typeof* [`RECOMMENDED_RULES`](/api/@graphorin/eslint-plugin/variables/RECOMMENDED_RULES.md); \} | src/index.ts:86 |
| `configs.flat/recommended.plugins` | `Record`\&lt;`string`, `unknown`\&gt; | src/index.ts:87 |
| `configs.flat/recommended.rules` | *typeof* [`RECOMMENDED_RULES`](/api/@graphorin/eslint-plugin/variables/RECOMMENDED_RULES.md) | src/index.ts:88 |
| `configs.recommended` | \{ `plugins`: readonly `string`[]; `rules`: *typeof* [`RECOMMENDED_RULES`](/api/@graphorin/eslint-plugin/variables/RECOMMENDED_RULES.md); \} | src/index.ts:82 |
| `configs.recommended.plugins` | readonly `string`[] | src/index.ts:83 |
| `configs.recommended.rules` | *typeof* [`RECOMMENDED_RULES`](/api/@graphorin/eslint-plugin/variables/RECOMMENDED_RULES.md) | src/index.ts:84 |
| <a id="property-meta"></a> `meta` | *typeof* [`meta`](/api/@graphorin/eslint-plugin/variables/meta.md) | src/index.ts:79 |
| <a id="property-rules"></a> `rules` | *typeof* [`rules`](/api/@graphorin/eslint-plugin/variables/rules.md) | src/index.ts:80 |
