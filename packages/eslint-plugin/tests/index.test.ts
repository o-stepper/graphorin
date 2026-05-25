import { describe, expect, it } from 'vitest';

import plugin, { meta, rules, VERSION } from '../src/index.js';

describe('@graphorin/eslint-plugin', () => {
  it('exports a plugin object with meta and rules', () => {
    expect(plugin.meta.name).toBe('@graphorin/eslint-plugin');
    expect(plugin.meta.version).toBe(VERSION);
    expect(typeof plugin.rules).toBe('object');
  });

  it('exports the canonical version constant', () => {
    expect(VERSION).toBe('0.4.0');
    expect(meta.version).toBe(VERSION);
  });

  it('registers the no-console-in-public-api rule (no-op scaffold)', () => {
    expect(rules).toHaveProperty('no-console-in-public-api');
    const rule = rules['no-console-in-public-api'];
    expect(rule.meta?.type).toBe('suggestion');
    const listener = rule.create({} as never);
    expect(Object.keys(listener)).toHaveLength(0);
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
});
