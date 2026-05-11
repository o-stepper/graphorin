import { describe, expect, it } from 'vitest';

import * as pkg from '../src/index.js';

describe('@graphorin/secret-1password public surface', () => {
  it('declares the canonical version constant', () => {
    expect(pkg.VERSION).toBe('0.1.0');
  });

  it('re-exports the resolver factory and the default instance', () => {
    expect(typeof pkg.createOnePasswordResolver).toBe('function');
    expect(pkg.onePasswordResolver.scheme).toBe('op');
  });

  it('re-exports the CLI factory and the typed error', () => {
    expect(typeof pkg.createDefaultOpCli).toBe('function');
    expect(typeof pkg.OpCliError).toBe('function');
    expect(typeof pkg.normalizeOpUri).toBe('function');
  });
});
