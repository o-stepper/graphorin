import { describe, expect, it } from 'vitest';

import { acceptsSensitivity, SENSITIVITY_ORDER } from '../src/types/sensitivity.js';

describe('Sensitivity', () => {
  it('orders public < internal < secret', () => {
    expect(SENSITIVITY_ORDER).toEqual(['public', 'internal', 'secret']);
  });

  it('acceptsSensitivity uses subset semantics', () => {
    expect(acceptsSensitivity(['public'], 'public')).toBe(true);
    expect(acceptsSensitivity(['public'], 'internal')).toBe(false);
    expect(acceptsSensitivity(['public', 'internal'], 'internal')).toBe(true);
    expect(acceptsSensitivity(['public', 'internal'], 'secret')).toBe(false);
    expect(acceptsSensitivity(['public', 'internal', 'secret'], 'secret')).toBe(true);
  });
});
