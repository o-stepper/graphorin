[**Graphorin API reference v0.6.1**](../../../index.md)

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

Defined in: [packages/eslint-plugin/src/index.ts:73](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L73)

PS-17: ship BOTH config shapes. `recommended` is the legacy `.eslintrc` form
(`plugins: ['@graphorin']`); `flat/recommended` is the ESLint 9+ flat-config
form that maps the namespace to the plugin object, so flat-config consumers
can `...plugin.configs['flat/recommended']` instead of hand-wiring ten rules.

## Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| <a id="property-configs"></a> `configs` | \{ `flat/recommended`: \{ `plugins`: `Record`\&lt;`string`, `unknown`\&gt;; `rules`: *typeof* `RECOMMENDED_RULES`; \}; `recommended`: \{ `plugins`: readonly `string`[]; `rules`: *typeof* `RECOMMENDED_RULES`; \}; \} | [packages/eslint-plugin/src/index.ts:76](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L76) |
| `configs.flat/recommended` | \{ `plugins`: `Record`\&lt;`string`, `unknown`\&gt;; `rules`: *typeof* `RECOMMENDED_RULES`; \} | [packages/eslint-plugin/src/index.ts:81](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L81) |
| `configs.flat/recommended.plugins` | `Record`\&lt;`string`, `unknown`\&gt; | [packages/eslint-plugin/src/index.ts:82](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L82) |
| `configs.flat/recommended.rules` | *typeof* `RECOMMENDED_RULES` | [packages/eslint-plugin/src/index.ts:83](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L83) |
| `configs.recommended` | \{ `plugins`: readonly `string`[]; `rules`: *typeof* `RECOMMENDED_RULES`; \} | [packages/eslint-plugin/src/index.ts:77](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L77) |
| `configs.recommended.plugins` | readonly `string`[] | [packages/eslint-plugin/src/index.ts:78](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L78) |
| `configs.recommended.rules` | *typeof* `RECOMMENDED_RULES` | [packages/eslint-plugin/src/index.ts:79](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L79) |
| <a id="property-meta"></a> `meta` | *typeof* [`meta`](/api/@graphorin/eslint-plugin/variables/meta.md) | [packages/eslint-plugin/src/index.ts:74](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L74) |
| <a id="property-rules"></a> `rules` | *typeof* [`rules`](/api/@graphorin/eslint-plugin/variables/rules.md) | [packages/eslint-plugin/src/index.ts:75](https://github.com/o-stepper/graphorin/blob/main/packages/eslint-plugin/src/index.ts#L75) |
