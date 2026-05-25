[**Graphorin API reference v0.4.0**](../../../index.md)

***

[Graphorin API reference](/api/index.md) / [@graphorin/eslint-plugin](/api/@graphorin/eslint-plugin/index.md) / default

# Variable: default

```ts
const default: {
  configs: {
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
  meta: {
     name: "@graphorin/eslint-plugin";
     version: "0.4.0";
  };
  rules: {
     no-bare-tool-exec: RuleModule;
     no-console-in-public-api: RuleModule;
     no-implicit-network-call: RuleModule;
     no-secret-in-deps: RuleModule;
     no-secret-unwrap: RuleModule;
     no-third-party-workflow-aliases: RuleModule;
     provider-middleware-order: RuleModule;
     tool-description-required: RuleModule;
     tool-examples-recommended: RuleModule;
     tool-parameter-naming: RuleModule;
  };
};
```

Defined in: index.ts:87

## Type Declaration

| Name | Type | Default value | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="property-configs"></a> `configs` | \{ `recommended`: \{ `plugins`: readonly \[`"@graphorin"`\]; `rules`: \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \}; \}; \} | - | index.ts:87 |
| `configs.recommended` | \{ `plugins`: readonly \[`"@graphorin"`\]; `rules`: \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \}; \} | - | index.ts:58 |
| `configs.recommended.plugins` | readonly \[`"@graphorin"`\] | - | index.ts:59 |
| `configs.recommended.rules` | \{ `@graphorin/no-bare-tool-exec`: `"warn"`; `@graphorin/no-implicit-network-call`: `"error"`; `@graphorin/no-secret-in-deps`: `"error"`; `@graphorin/no-secret-unwrap`: `"error"`; `@graphorin/no-third-party-workflow-aliases`: `"error"`; `@graphorin/provider-middleware-order`: `"error"`; `@graphorin/tool-description-required`: `"error"`; `@graphorin/tool-examples-recommended`: `"warn"`; `@graphorin/tool-parameter-naming`: `"warn"`; \} | - | index.ts:60 |
| `configs.recommended.rules.@graphorin/no-bare-tool-exec` | `"warn"` | `'warn'` | index.ts:61 |
| `configs.recommended.rules.@graphorin/no-implicit-network-call` | `"error"` | `'error'` | index.ts:62 |
| `configs.recommended.rules.@graphorin/no-secret-in-deps` | `"error"` | `'error'` | index.ts:63 |
| `configs.recommended.rules.@graphorin/no-secret-unwrap` | `"error"` | `'error'` | index.ts:64 |
| `configs.recommended.rules.@graphorin/no-third-party-workflow-aliases` | `"error"` | `'error'` | index.ts:65 |
| `configs.recommended.rules.@graphorin/provider-middleware-order` | `"error"` | `'error'` | index.ts:66 |
| `configs.recommended.rules.@graphorin/tool-description-required` | `"error"` | `'error'` | index.ts:67 |
| `configs.recommended.rules.@graphorin/tool-examples-recommended` | `"warn"` | `'warn'` | index.ts:68 |
| `configs.recommended.rules.@graphorin/tool-parameter-naming` | `"warn"` | `'warn'` | index.ts:69 |
| <a id="property-meta"></a> `meta` | \{ `name`: `"@graphorin/eslint-plugin"`; `version`: `"0.4.0"`; \} | - | index.ts:87 |
| `meta.name` | `"@graphorin/eslint-plugin"` | `'@graphorin/eslint-plugin'` | index.ts:40 |
| `meta.version` | `"0.4.0"` | `VERSION` | index.ts:41 |
| <a id="property-rules"></a> `rules` | \{ `no-bare-tool-exec`: `RuleModule`; `no-console-in-public-api`: `RuleModule`; `no-implicit-network-call`: `RuleModule`; `no-secret-in-deps`: `RuleModule`; `no-secret-unwrap`: `RuleModule`; `no-third-party-workflow-aliases`: `RuleModule`; `provider-middleware-order`: `RuleModule`; `tool-description-required`: `RuleModule`; `tool-examples-recommended`: `RuleModule`; `tool-parameter-naming`: `RuleModule`; \} | - | index.ts:87 |
| `rules.no-bare-tool-exec` | `RuleModule` | `noBareToolExec` | index.ts:45 |
| `rules.no-console-in-public-api` | `RuleModule` | `noConsoleInPublicApi` | index.ts:46 |
| `rules.no-implicit-network-call` | `RuleModule` | `noImplicitNetworkCall` | index.ts:47 |
| `rules.no-secret-in-deps` | `RuleModule` | `noSecretInDeps` | index.ts:48 |
| `rules.no-secret-unwrap` | `RuleModule` | `noSecretUnwrap` | index.ts:49 |
| `rules.no-third-party-workflow-aliases` | `RuleModule` | `noThirdPartyWorkflowAliases` | index.ts:50 |
| `rules.provider-middleware-order` | `RuleModule` | `providerMiddlewareOrder` | index.ts:51 |
| `rules.tool-description-required` | `RuleModule` | `toolDescriptionRequired` | index.ts:52 |
| `rules.tool-examples-recommended` | `RuleModule` | `toolExamplesRecommended` | index.ts:53 |
| `rules.tool-parameter-naming` | `RuleModule` | `toolParameterNaming` | index.ts:54 |
