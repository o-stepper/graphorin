# @graphorin/eslint-plugin

> ESLint rules for projects that build on **Graphorin**.

- **Status:** v0.3.0 — final Phase 16 ruleset.
- **License:** [MIT](./LICENSE) — © 2026 Oleksiy Stepurenko.
- **Engines:** Node.js 22+ (ESM only).
- **Peer dependency:** `eslint >= 9`.

## Installation

```bash
pnpm add -D eslint @graphorin/eslint-plugin
```

## Usage (ESLint flat config — `eslint.config.js`)

```js
import graphorin from '@graphorin/eslint-plugin';

export default [
  {
    plugins: { '@graphorin': graphorin },
    rules: {
      '@graphorin/tool-description-required': 'error',
      '@graphorin/tool-examples-recommended': 'warn',
      '@graphorin/tool-parameter-naming': 'warn',
      '@graphorin/no-secret-unwrap': 'error',
      '@graphorin/no-secret-in-deps': 'error',
      '@graphorin/no-implicit-network-call': 'error',
      '@graphorin/no-third-party-workflow-aliases': 'error',
      '@graphorin/provider-middleware-order': 'error',
      '@graphorin/no-bare-tool-exec': 'warn',
    },
  },
];
```

The bundled `recommended` config wires every active rule at the
severities documented below; consumers can extend it directly:

```js
import graphorin from '@graphorin/eslint-plugin';

export default [
  graphorin.configs.recommended,
];
```

## Rules

| Rule | Status |
|---|---|
| `tool-description-required` | Active. Flags `tool({...})` registrations whose `description` is missing, shorter than 20 characters, or a placeholder value (`'TODO'`, `'FIXME'`, `'tbd'`, `'description'`, `'placeholder'`). |
| `tool-examples-recommended` | Active. Flags missing or empty `examples` arrays and rejects more than the documented upper bound (5). |
| `tool-parameter-naming` | Active. Flags ambiguous single-word parameter names (`user`, `id`, `name`, `value`, `data`, `input`, `output`, `result`, `to`, `from`, `key`, `field`) and numeric-suffix names (`arg1`, `param2`) on `inputSchema: z.object({ ... })`. Per-tool opt-out via `tags: ['experimental']` or `tags: ['legacy']`. |
| `no-secret-unwrap` | Active. Flags `.unwrap()` and `.reveal()` calls on `SecretValue`-shaped expressions. `.unwrap()` is reported as `'error'` regardless of comments (the method is `@deprecated`); `.reveal()` honours the `// graphorin-allow-secret-unwrap: <reason>` opt-out. |
| `no-secret-in-deps` | Active. Flags `Agent.toTool({ inheritSecrets: [...] })` calls whose allowlist is non-empty and lacks an `// rb-24-justification: <reason>` comment. |
| `provider-middleware-order` | Active. Lint-time enforcement of the canonical `withTracing → withRetry → withRateLimit → withCostLimit → withCostTracking → withFallback → withRedaction` ordering. |
| `no-implicit-network-call` | Active. Flags bare `fetch(...)` / `axios.get(...)` / `https.request(...)` / `new XMLHttpRequest()` invocations in `@graphorin/*` framework code without the explicit `// graphorin-allow-network: <reason>` opt-out. |
| `no-third-party-workflow-aliases` | Active. Flags identifiers that mirror third-party-library workflow primitives in the `@graphorin/workflow` package's source so the framework keeps its own naming. |
| `no-bare-tool-exec` | Active. Flags `tool({ execute })` functions that do not reference `signal` so long-running tools always propagate the cancellation contract. |
| `no-console-in-public-api` | Scaffold (no-op). Will flag `console.*` calls in code that is part of a package's public surface; activates after the v0.1 public-API freeze. |

## Programmatic discovery (single source of truth)

The three `tool-*` rules are also exposed as plain helpers so `graphorin tools lint` reuses the same logic without re-importing through the ESLint runtime:

```ts
import {
  AMBIGUOUS_PARAMETER_NAMES,
  discoverToolCallsInSource,
  gradeTool,
  PARAMETER_NAMING_OPT_OUT_TAGS,
  PLACEHOLDER_DESCRIPTIONS,
  runToolRules,
} from '@graphorin/eslint-plugin';

const source = await readFile('src/tools/send-email.ts', 'utf8');
const tools = discoverToolCallsInSource('src/tools/send-email.ts', source);
for (const tool of tools) {
  const findings = runToolRules(tool);
  const score = gradeTool(tool, findings);
  console.log(`${tool.name}: ${score.score}/100`);
}
```

## Versioning

`@graphorin/eslint-plugin` follows the same lockstep release as the rest of the `@graphorin/*` packages while the framework is on the `0.x` line. Once Graphorin reaches `1.0`, the plugin will move to its own release cadence.

---

**Graphorin** · v0.3.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
