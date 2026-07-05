/**
 * SDF-8 / FIDES-lattice: feed the PII catalogue into the taint ledger so a tool
 * reading user/PII content (which defaults to the `'internal'` tier, not
 * `'secret'`) can count toward `sensitiveSeen` - making the lethal-trifecta leg
 * cover PII exfiltration, not only explicitly secret-tagged tools. Opt-in: a
 * ledger created without `piiSensitivity` is byte-identical to today.
 */

import { describe, expect, it } from 'vitest';
import { containsPii, createTaintLedger, deriveTaintLabel } from '../../src/index.js';

const internalLabel = deriveTaintLabel({
  trustClass: 'first-party-built-in',
  sensitivity: 'internal',
});

describe('FIDES-lattice: containsPii', () => {
  it('detects catalogued PII (email, SSN)', () => {
    expect(containsPii('reach me at alice@example.com')).toBe(true);
    expect(containsPii('SSN 123-45-6789 on file')).toBe(true);
  });

  it('does not flag plain prose', () => {
    expect(containsPii('the quick brown fox jumps over the lazy dog')).toBe(false);
  });
});

describe('FIDES-lattice: PII feeds the ledger sensitive leg', () => {
  it('flips sensitiveSeen on a PII read when piiSensitivity is wired - without a secret tag', () => {
    expect(internalLabel.sensitive).toBe(false); // internal, not secret
    const ledger = createTaintLedger({ piiSensitivity: containsPii });
    ledger.recordOutput(internalLabel, 'customer SSN 123-45-6789');
    expect(ledger.sensitiveSeen).toBe(true);
  });

  it('is byte-identical when piiSensitivity is not wired (default off)', () => {
    const ledger = createTaintLedger();
    ledger.recordOutput(internalLabel, 'customer SSN 123-45-6789');
    expect(ledger.sensitiveSeen).toBe(false);
  });
});
