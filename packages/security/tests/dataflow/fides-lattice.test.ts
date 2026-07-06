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

  // W-150: the PII catalogue applies the same obfuscation pre-pass
  // (NFKC + zero-width strip) the injection catalogue already uses -
  // cheap character-injection must not dodge the sensitiveSeen leg.
  // Obfuscated fixtures are built from escapes so this file itself
  // stays free of invisible characters.
  it('detects a zero-width-split email (W-150)', () => {
    expect(containsPii('reach me at ali\u200bce@exam\u200bple.com')).toBe(true);
  });

  it('detects an SSN written with fullwidth digits (W-150)', () => {
    const fullwidth = (t: string) =>
      t.replace(/\d/g, (d) => String.fromCodePoint(0xff10 + Number(d)));
    expect(containsPii(`SSN ${fullwidth('123-45-6789')} on file`)).toBe(true);
  });

  it('still detects an uppercase IBAN (case-preserving normalization)', () => {
    expect(containsPii('wire to DE89370400440532013000 today')).toBe(true);
  });

  it('flips sensitiveSeen for obfuscated PII through the ledger (W-150)', () => {
    const ledger = createTaintLedger({ piiSensitivity: containsPii });
    ledger.recordOutput(internalLabel, 'customer SSN 1\u200b23-45-6789');
    expect(ledger.sensitiveSeen).toBe(true);
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
