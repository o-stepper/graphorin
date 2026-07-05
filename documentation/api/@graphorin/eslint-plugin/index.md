[**Graphorin API reference v0.6.0**](../../index.md)

***

[Graphorin API reference](/api/index.md) / @graphorin/eslint-plugin

# @graphorin/eslint-plugin

> ESLint rules for projects that build on **Graphorin**.

- **Status:** v0.6.0 - final Phase 16 ruleset.
- **License:** [MIT](https://github.com/o-stepper/graphorin/blob/main/LICENSE) - © 2026 Oleksiy Stepurenko.
- **Engines:** Node.js 22+ (ESM only).
- **Peer dependency:** `eslint >= 9`.

## Installation

```bash
pnpm add -D eslint @graphorin/eslint-plugin
```

## Usage (ESLint flat config - `eslint.config.js`)

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

The bundled config wires every active rule at the severities documented below.
For ESLint 9+ flat config (`eslint.config.js`), spread `flat/recommended` - it
maps the `@graphorin` namespace to the plugin object for you:

```js
import graphorin from '@graphorin/eslint-plugin';

export default [
  graphorin.configs['flat/recommended'],
];
```

The legacy `.eslintrc` form is still exported as `configs.recommended`
(`plugins: ['@graphorin']`) for ESLint 8 consumers.

## Rules

| Rule | Status |
|---|---|
| `tool-description-required` | Active. Flags `tool({...})` registrations whose `description` is missing, shorter than 20 characters, or a placeholder value (`'TODO'`, `'FIXME'`, `'tbd'`, `'description'`, `'placeholder'`). |
| `tool-examples-recommended` | Active. Flags missing or empty `examples` arrays and rejects more than the documented upper bound (5). |
| `tool-parameter-naming` | Active. Flags ambiguous single-word parameter names (`user`, `id`, `name`, `value`, `data`, `input`, `output`, `result`, `to`, `from`, `key`, `field`) and numeric-suffix names (`arg1`, `param2`) on `inputSchema: z.object({ ... })`. Per-tool opt-out via `tags: ['experimental']` or `tags: ['legacy']`. |
| `no-secret-unwrap` | Active. Flags `.unwrap()` and `.reveal()` calls on `SecretValue`-shaped expressions. `.unwrap()` is reported as `'error'` regardless of comments (the method is `@deprecated`); `.reveal()` honours the `// graphorin-allow-secret-unwrap: <reason>` opt-out. |
| `no-secret-in-deps` | Active. Flags `withChildToolSecretsContext({ secretsAllowed: [...] })` grants whose allowlist is non-empty and lacks an `// rb-24-justification: <reason>` comment (DEC-137). |
| `provider-middleware-order` | Active. Lint-time enforcement of the canonical `withTracing → withRetry → withRateLimit → withCostLimit → withCostTracking → withFallback → withRedaction` ordering. |
| `no-implicit-network-call` | Active. Flags network primitives in `@graphorin/*` framework code without the explicit `// graphorin-allow-network: <reason>` opt-out: `fetch(...)` / `axios.*` / `undici.*` / `got.*` / `http(s).request` / raw `net`·`tls`·`dgram` sockets / `new WebSocket` / `new EventSource` / `new XMLHttpRequest`, plus static, dynamic, and `require()` imports of HTTP clients (`node-fetch`, `undici`, `got`, `axios`, `ky`, `ws`). Kept in lockstep with `scripts/check-no-network.mjs`. |
| `no-third-party-workflow-aliases` | Active. Flags identifiers that mirror third-party-library workflow primitives in the `@graphorin/workflow` package's source so the framework keeps its own naming. |
| `no-bare-tool-exec` | Active. Flags `tool({ execute })` functions that do not reference `signal` so long-running tools always propagate the cancellation contract. |

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

**Graphorin** · v0.6.0 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>

@graphorin/eslint-plugin - ESLint plugin for projects that build on
the Graphorin framework.

Phase 16 final ruleset:

  - `no-secret-unwrap`                  - DEC-020 / ADR-026. Active.
  - `no-secret-in-deps`                 - DEC-137. Active.
  - `provider-middleware-order`         - DEC-145 / ADR-039. Active.
  - `no-implicit-network-call`          - DEC-154 / ADR-041. Active.
  - `no-third-party-workflow-aliases`   - DEC-019 / ADR-029. Active.
  - `no-bare-tool-exec`                 - principle 3 / DEC-143. Active.
  - `tool-description-required`         - Active.
  - `tool-examples-recommended`         - Active.
  - `tool-parameter-naming`             - Active.

(The former `no-console-in-public-api` scaffold - a permanent no-op
since Phase 01 - was removed in the v0.4 hygiene pass (PS-21) rather
than shipped inert.)

## Interfaces

| Interface | Description |
| ------ | ------ |
| [DiscoveredTool](/api/@graphorin/eslint-plugin/interfaces/DiscoveredTool.md) | - |
| [LintFinding](/api/@graphorin/eslint-plugin/interfaces/LintFinding.md) | - |
| [ToolGraderScore](/api/@graphorin/eslint-plugin/interfaces/ToolGraderScore.md) | - |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [LintFindingKind](/api/@graphorin/eslint-plugin/type-aliases/LintFindingKind.md) | - |

## Variables

| Variable | Description |
| ------ | ------ |
| [AMBIGUOUS\_PARAMETER\_NAMES](/api/@graphorin/eslint-plugin/variables/AMBIGUOUS_PARAMETER_NAMES.md) | Generic identifiers the parameter-naming rule flags as ambiguous. Tools whose `inputSchema` references only specific identifiers (e.g. `userId`, `recipientEmail`, `apiKey`) get full credit on the naming axis. |
| [configs](/api/@graphorin/eslint-plugin/variables/configs.md) | - |
| [default](/api/@graphorin/eslint-plugin/variables/default.md) | PS-17: ship BOTH config shapes. `recommended` is the legacy `.eslintrc` form (`plugins: ['@graphorin']`); `flat/recommended` is the ESLint 9+ flat-config form that maps the namespace to the plugin object, so flat-config consumers can `...plugin.configs['flat/recommended']` instead of hand-wiring ten rules. |
| [meta](/api/@graphorin/eslint-plugin/variables/meta.md) | - |
| [PARAMETER\_NAMING\_OPT\_OUT\_TAGS](/api/@graphorin/eslint-plugin/variables/PARAMETER_NAMING_OPT_OUT_TAGS.md) | Tag values that, when present in a tool's `tags: [...]` literal, suppress the parameter-naming rule for that tool. The opt-out exists so operators can defer the rename for a long tail of pre-RB-49 tools while the framework migrates without breaking calling code. |
| [PLACEHOLDER\_DESCRIPTIONS](/api/@graphorin/eslint-plugin/variables/PLACEHOLDER_DESCRIPTIONS.md) | Placeholder values the description-required rule treats as non-descriptions. |
| [rules](/api/@graphorin/eslint-plugin/variables/rules.md) | - |
| [VERSION](/api/@graphorin/eslint-plugin/variables/VERSION.md) | - |

## Functions

| Function | Description |
| ------ | ------ |
| [discoverToolCallsInSource](/api/@graphorin/eslint-plugin/functions/discoverToolCallsInSource.md) | Discover every `tool({...})` invocation in a source string. The returned findings are stable + frozen so callers can pass them straight into a JSON report. |
| [gradeTool](/api/@graphorin/eslint-plugin/functions/gradeTool.md) | Compute the per-tool grader score (0..100). Each axis is gated by the findings produced for that axis. The rubric is calibrated against the RB-49 fixture catalog (`wellDescribedTool` -> 82, `placeholderDescriptionTool` -> 20, `examplesPiiTool` -> 61). |
| [runToolRules](/api/@graphorin/eslint-plugin/functions/runToolRules.md) | Run the three RB-49 rules against a discovered tool and return the findings. The CLI grader maps these findings into per-axis scores; the ESLint rules forward them to `context.report(...)`. |
