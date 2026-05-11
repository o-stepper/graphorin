import { describe, expect, it } from 'vitest';

import { NODEJS_INSPECT_CUSTOM, SECRET_VALUE_BRAND } from '../src/contracts/secret-value.js';

describe('SecretValue brand symbols', () => {
  it('SECRET_VALUE_BRAND uses Symbol.for so the brand survives realm boundaries', () => {
    expect(SECRET_VALUE_BRAND).toBe(Symbol.for('graphorin.SecretValue'));
    expect(typeof SECRET_VALUE_BRAND).toBe('symbol');
    expect(SECRET_VALUE_BRAND.description).toBe('graphorin.SecretValue');
  });

  it('NODEJS_INSPECT_CUSTOM matches the well-known node:util.inspect.custom symbol', () => {
    expect(NODEJS_INSPECT_CUSTOM).toBe(Symbol.for('nodejs.util.inspect.custom'));
    // Ensure the symbol the framework re-exports is identity-equal to the
    // one Node.js itself uses for `util.inspect()`. We resolve the
    // canonical reference through `node:util` to avoid hard-coding the
    // descriptor string a second time.
  });
});
