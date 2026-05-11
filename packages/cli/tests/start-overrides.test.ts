import { describe, expect, it } from 'vitest';

import { applyCliOverrides } from '../src/commands/start.js';

describe('applyCliOverrides', () => {
  it('passes the input through when no overrides are supplied', () => {
    const out = applyCliOverrides({ server: { port: 3000 } }, {});
    expect(out).toEqual({ server: { port: 3000 } });
  });

  it('merges host + port overrides into server', () => {
    const out = applyCliOverrides({ server: { port: 3000 } }, { host: '0.0.0.0', port: 9000 });
    expect(out.server).toEqual({ port: 9000, host: '0.0.0.0' });
  });

  it('merges secretsSource + strictSecrets overrides into secrets', () => {
    const out = applyCliOverrides({}, { secretsSource: 'env', strictSecrets: true });
    expect(out.secrets).toEqual({ source: 'env', strict: true });
  });

  it('preserves unrelated fields', () => {
    const out = applyCliOverrides(
      { server: { port: 3000 }, secrets: { strict: false } },
      { secretsSource: 'keyring' },
    );
    expect(out.server).toEqual({ port: 3000 });
    expect(out.secrets).toEqual({ strict: false, source: 'keyring' });
  });

  it('omits the override sub-objects when no flags target them', () => {
    const out = applyCliOverrides({ server: { port: 3000 } }, {});
    expect(out.secrets).toBeUndefined();
  });

  it('handles undefined input', () => {
    const out = applyCliOverrides(undefined, { secretsSource: 'env' });
    expect(out.secrets).toEqual({ source: 'env' });
  });
});
