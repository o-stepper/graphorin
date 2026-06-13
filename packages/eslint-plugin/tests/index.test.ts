import { dirname } from 'node:path';

import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import plugin, { meta, rules, VERSION } from '../src/index.js';

describe('@graphorin/eslint-plugin', () => {
  it('exports a plugin object with meta and rules', () => {
    expect(plugin.meta.name).toBe('@graphorin/eslint-plugin');
    expect(plugin.meta.version).toBe(VERSION);
    expect(typeof plugin.rules).toBe('object');
  });

  it('exports the canonical version constant', () => {
    expect(VERSION).toBe('0.5.0');
    expect(meta.version).toBe(VERSION);
  });

  it('no longer registers the removed no-console-in-public-api scaffold (PS-21)', () => {
    expect(rules).not.toHaveProperty('no-console-in-public-api');
  });

  it('registers the no-secret-unwrap rule as an active CallExpression visitor', () => {
    expect(rules).toHaveProperty('no-secret-unwrap');
    const rule = rules['no-secret-unwrap'];
    expect(rule.meta?.type).toBe('problem');
    expect(rule.meta?.messages).toHaveProperty('avoidUnwrap');
    expect(rule.meta?.messages).toHaveProperty('avoidReveal');
    const listener = rule.create({} as never);
    expect(listener).toHaveProperty('CallExpression');
  });

  it('registers the three tool-* rules with messages', () => {
    expect(rules).toHaveProperty('tool-description-required');
    expect(rules).toHaveProperty('tool-examples-recommended');
    expect(rules).toHaveProperty('tool-parameter-naming');
    expect(rules['tool-description-required'].meta?.messages).toHaveProperty('missing');
    expect(rules['tool-examples-recommended'].meta?.messages).toHaveProperty('missing');
    expect(rules['tool-parameter-naming'].meta?.messages).toHaveProperty('ambiguous');
    expect(rules['tool-parameter-naming'].meta?.messages).toHaveProperty('numericSuffix');
  });

  it('registers the Phase 16 ruleset additions', () => {
    expect(rules).toHaveProperty('no-secret-in-deps');
    expect(rules).toHaveProperty('provider-middleware-order');
    expect(rules).toHaveProperty('no-implicit-network-call');
    expect(rules).toHaveProperty('no-third-party-workflow-aliases');
    expect(rules).toHaveProperty('no-bare-tool-exec');
  });

  it('recommended config wires the Phase 16 ruleset additions at sensible severities', () => {
    expect(plugin.configs.recommended.rules).toMatchObject({
      '@graphorin/no-secret-in-deps': 'error',
      '@graphorin/no-secret-unwrap': 'error',
      '@graphorin/provider-middleware-order': 'error',
      '@graphorin/no-implicit-network-call': 'error',
      '@graphorin/no-third-party-workflow-aliases': 'error',
      '@graphorin/no-bare-tool-exec': 'warn',
    });
  });

  it('ships a flat-config recommended preset for ESLint 9+ (PS-17)', () => {
    const flat = plugin.configs['flat/recommended'];
    expect(flat).toBeDefined();
    // Flat config maps the namespace to the plugin OBJECT, not the `['@graphorin']`
    // string the legacy `.eslintrc` form uses.
    expect(flat.plugins['@graphorin']).toBe(plugin);
    expect(flat.rules).toEqual(plugin.configs.recommended.rules);
    // The legacy form is retained for ESLint <9.
    expect(plugin.configs.recommended.plugins).toEqual(['@graphorin']);

    // Smoke: a flat-config array spreading the preset lints a fixture and the
    // rules fire (the whole point — flat-config consumers couldn't use the
    // string-array `recommended`). `cwd` must prefix the `files` glob match.
    const filename = '/repo/packages/example/src/example.js';
    const linter = new Linter({ cwd: dirname(filename) });
    const messages = linter.verify(
      `await fetch('https://example.com');`,
      [
        { files: ['**/*.js'], languageOptions: { ecmaVersion: 2023, sourceType: 'module' } },
        flat as Linter.Config,
      ],
      filename,
    );
    expect(messages.some((m) => m.ruleId === '@graphorin/no-implicit-network-call')).toBe(true);
  });
});
