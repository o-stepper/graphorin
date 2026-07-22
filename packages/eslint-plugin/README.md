# @graphorin/eslint-plugin

> ESLint rules for projects that build on **Graphorin**.

- **Status:** v0.15.1 - final Phase 16 ruleset.
- **License:** [MIT](./LICENSE) - © 2026 Oleksiy Stepurenko.
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
| `no-secret-unwrap` | Active. Flags `.unwrap()` and `.reveal()` calls on `SecretValue`-shaped expressions. `.unwrap()` is reported as `'error'` regardless of comments (the method is `@deprecated`); `.reveal()` honours the `// graphorin-allow-secret-unwrap: <reason>` opt-out. Known collision: Zod's `ZodOptional`/`ZodNullable`/`ZodDefault` `.unwrap()` (and Rust-style result libraries) false-positive - either turn the rule off for introspection files (`{ files: ['**/schema-introspection/**'], rules: { '@graphorin/no-secret-unwrap': 'off' } }`) or set the carve-out option `['error', { allowReceiverPattern: 'Schema$' }]`, which skips receivers whose source text matches. Pick a NARROW suffix pattern (a broad regex would silence real `SecretValue.unwrap` calls); prefer the file-glob override when the collision is confined to a directory. |
| `no-secret-in-deps` | Active. Flags `withChildToolSecretsContext({ secretsAllowed: [...] })` grants whose allowlist is non-empty and lacks an `// rb-24-justification: <reason>` comment (DEC-137). |
| `provider-middleware-order` | Active. Lint-time enforcement of the canonical `withTracing → withRetry → withRateLimit → withCostLimit → withCostTracking → withFallback → withRedaction` ordering. |
| `no-implicit-network-call` | Active. Flags network primitives in framework code without the explicit `// graphorin-allow-network: <reason>` opt-out: `fetch(...)` / `axios.*` / `undici.*` / `got.*` / `http(s).request` / raw `net`·`tls`·`dgram` sockets / `new WebSocket` / `new EventSource` / `new XMLHttpRequest`, plus static, dynamic, and `require()` imports of HTTP clients (`node-fetch`, `undici`, `got`, `axios`, `ky`, `ws`). Activation is two-stage: the file path must match `packages/*/src` AND the nearest `package.json` name must start with a prefix from `packagePrefixes` (default `['@graphorin/']`), so a downstream monorepo with the standard layout is not flagged; when no package.json resolves (virtual paths), the rule FAILS OPEN to path-only activation. Polices your own scope via `'@graphorin/no-implicit-network-call': ['error', { packagePrefixes: ['@myorg/'] }]`. Kept in lockstep with `scripts/check-no-network.mjs` (contract-tested). |
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

### Discovery contract

The discovery is **text-based by design** (one implementation serves both the CLI and the ESLint rules). Its contract:

- **Comment-aware.** Discovery and grading run over a comment-blanked view of the source: a commented-out `tool({...})` is never discovered, a commented-out property inside a live literal is never extracted, and a commented email inside a live `examples:` block never penalizes the axis. `DiscoveredTool.source` keeps the original text for reports; grading consumes `DiscoveredTool.gradingSource`. String, template, and (conservatively) regex literals are left untouched, and a `tool(` inside a string never matches.
- **False positives.** Any callee whose last lexical token is `tool(` matches - including method calls like `.tool(` and same-named local helpers. Renamed or wrapped invocations (`const t = tool; t({...})`) are NOT seen. This is the accepted cost of the text-based surface.
- **Anti-degenerate description guard.** A description of 80+ chars scores the top tier only if it looks like prose: under 4 unique words, or one word carrying more than half the text, caps the axis at 16.

## Versioning

`@graphorin/eslint-plugin` follows the same lockstep release as the rest of the `@graphorin/*` packages while the framework is on the `0.x` line. Once Graphorin reaches `1.0`, the plugin will move to its own release cadence.

---

**Graphorin** · v0.15.1 · MIT License · © 2026 Oleksiy Stepurenko · <https://github.com/o-stepper/graphorin>
