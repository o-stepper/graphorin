import { describe, expect, it } from 'vitest';

import {
  GraphorinSupplyChainError,
  SkillInstallDeniedError,
  SkillInstallError,
  SkillManifestParseError,
  SkillSignatureInvalidError,
  SkillSignatureMissingError,
  TrustLevelEscalationError,
} from '../../src/supply-chain/index.js';

describe('@graphorin/security/supply-chain — typed errors', () => {
  it('every error carries a stable kind', () => {
    expect(new SkillSignatureMissingError('skill:x').kind).toBe('signature-missing');
    expect(new SkillSignatureInvalidError('skill:x', 'bad', 'pub').kind).toBe('signature-invalid');
    expect(new SkillInstallDeniedError('skill:x', 'denylist', '@x/*').kind).toBe('install-denied');
    expect(new SkillInstallError('skill:x', 'm', { exitCode: 1 }).kind).toBe('install-failed');
    expect(new SkillManifestParseError('m').kind).toBe('manifest-parse');
    expect(new TrustLevelEscalationError('trusted-with-scripts').kind).toBe('trust-escalation');
  });

  it('SkillInstallError captures exit code + stderr', () => {
    const err = new SkillInstallError('skill:x', 'failed', { exitCode: 7, stderr: 'boom' });
    expect(err.exitCode).toBe(7);
    expect(err.stderr).toBe('boom');
  });

  it('errors derive from a single base class', () => {
    expect(new SkillSignatureMissingError('x')).toBeInstanceOf(GraphorinSupplyChainError);
  });

  it('SkillSignatureInvalidError preserves publisher when set', () => {
    const err = new SkillSignatureInvalidError('x', 'bad', 'vendor');
    expect(err.publisher).toBe('vendor');
  });
});
