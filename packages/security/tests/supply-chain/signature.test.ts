import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  _setPublicKeyFetcherForTesting,
  _setSigstoreVerifierForTesting,
  SkillSignatureInvalidError,
  SkillSignatureMissingError,
  verifySkillSignature,
} from '../../src/supply-chain/index.js';

import { buildSignedSkill, resetSupplyChain, tamperSkillBody } from './_helpers.js';

describe('@graphorin/security/supply-chain — signature verifier', () => {
  beforeEach(() => {
    resetSupplyChain();
  });
  afterEach(() => {
    resetSupplyChain();
  });

  it('returns valid: true for a freshly signed skill (well-known)', async () => {
    const { skillMd, publicKeyPem } = buildSignedSkill({
      name: 'pdf-processing',
      publicKeyRef: { url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem' },
    });
    _setPublicKeyFetcherForTesting(async () => publicKeyPem);
    const result = await verifySkillSignature({ skillMd });
    expect(result.valid).toBe(true);
    expect(result.publisher).toBe('vendor.example.com');
    expect(result.publicKeySource).toBe('well-known');
  });

  it('returns valid: false when the SKILL.md body is tampered', async () => {
    const { skillMd, publicKeyPem } = buildSignedSkill({
      name: 'pdf-processing',
      publicKeyRef: { url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem' },
    });
    _setPublicKeyFetcherForTesting(async () => publicKeyPem);
    const tampered = tamperSkillBody(skillMd);
    const result = await verifySkillSignature({ skillMd: tampered });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('verification failed');
  });

  it('throws SkillSignatureMissingError when the block is absent', async () => {
    const skillMd = '---\nname: nope\n---\n# body\n';
    await expect(verifySkillSignature({ skillMd })).rejects.toBeInstanceOf(
      SkillSignatureMissingError,
    );
  });

  it('rejects mismatched fingerprints', async () => {
    const { skillMd, publicKeyPem } = buildSignedSkill({
      name: 'pdf-processing',
      publicKeyRef: {
        url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem',
        pinFingerprint: 'sha256:000000000000000000000000000000000000000000000000000000000000beef',
      },
    });
    _setPublicKeyFetcherForTesting(async () => publicKeyPem);
    await expect(verifySkillSignature({ skillMd })).rejects.toBeInstanceOf(
      SkillSignatureInvalidError,
    );
  });

  it('uses an injected sigstore verifier when the publicKeyRef is sigstore', async () => {
    const { skillMd, publicKeyPem } = buildSignedSkill({
      name: 'pdf-processing',
      publicKeyRef: { url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem' },
    });
    // Replace the publicKeyRef with sigstore + inject a verifier that
    // returns the same key.
    const sigstoreReplacement = `${[
      '  publicKeyRef:',
      '    kind: sigstore',
      '    identity: vendor@example.com',
      '    issuer: https://accounts.example.com',
    ].join('\n')}$1`;
    const skillMdSigstore = skillMd.replace(
      / {2}publicKeyRef:[\s\S]*?(\n---)/u,
      sigstoreReplacement,
    );
    _setSigstoreVerifierForTesting(async () => ({ publicKeyPem, fingerprint: 'sha256:dummy' }));
    const result = await verifySkillSignature({ skillMd: skillMdSigstore });
    expect(result.valid).toBe(true);
    expect(result.publicKeySource).toBe('sigstore');
  });

  it('throws when sigstore is referenced but no verifier is installed', async () => {
    const { skillMd } = buildSignedSkill({
      name: 'pdf-processing',
      publicKeyRef: { url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem' },
    });
    const sigstoreReplacement = `${[
      '  publicKeyRef:',
      '    kind: sigstore',
      '    identity: vendor@example.com',
      '    issuer: https://accounts.example.com',
    ].join('\n')}$1`;
    const skillMdSigstore = skillMd.replace(
      / {2}publicKeyRef:[\s\S]*?(\n---)/u,
      sigstoreReplacement,
    );
    await expect(verifySkillSignature({ skillMd: skillMdSigstore })).rejects.toBeInstanceOf(
      SkillSignatureInvalidError,
    );
  });

  it('uses publicKeySource override when provided', async () => {
    const { skillMd, publicKeyPem } = buildSignedSkill({
      name: 'pdf-processing',
      publicKeyRef: { url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem' },
    });
    const result = await verifySkillSignature({
      skillMd,
      publicKeySource: { publicKeyPem },
    });
    expect(result.valid).toBe(true);
  });

  it('verifies inline publicKeyRef without invoking the fetcher', async () => {
    const { skillMd, publicKeyPem } = buildSignedSkill({
      name: 'pdf-processing',
      publicKeyRef: { url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem' },
    });
    const inlinePem = publicKeyPem.replace(/\n/g, '\n      ');
    const inlineReplacement = `${[
      '  publicKeyRef:',
      '    kind: inline',
      `    publicKeyPem: |\n      ${inlinePem.trim()}`,
    ].join('\n')}$1`;
    const skillMdInline = skillMd.replace(/ {2}publicKeyRef:[\s\S]*?(\n---)/u, inlineReplacement);
    let fetcherCalled = false;
    _setPublicKeyFetcherForTesting(async () => {
      fetcherCalled = true;
      return publicKeyPem;
    });
    const result = await verifySkillSignature({ skillMd: skillMdInline });
    expect(result.valid).toBe(true);
    expect(result.publicKeySource).toBe('inline');
    expect(fetcherCalled).toBe(false);
  });

  it('throws when the fetched key is not a valid PEM', async () => {
    const { skillMd } = buildSignedSkill({
      name: 'pdf-processing',
      publicKeyRef: { url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem' },
    });
    _setPublicKeyFetcherForTesting(async () => 'not-a-pem');
    await expect(verifySkillSignature({ skillMd })).rejects.toBeInstanceOf(
      SkillSignatureInvalidError,
    );
  });

  it('rejects non-ed25519 keys', async () => {
    const { skillMd } = buildSignedSkill({
      name: 'pdf-processing',
      publicKeyRef: { url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem' },
    });
    // 1024-bit RSA-ish PEM (just a placeholder triggering the wrong-type error).
    const rsaPem = `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtXvE\n-----END PUBLIC KEY-----`;
    _setPublicKeyFetcherForTesting(async () => rsaPem);
    await expect(verifySkillSignature({ skillMd })).rejects.toBeInstanceOf(
      SkillSignatureInvalidError,
    );
  });

  describe('operator trust root (D4 / security-01)', () => {
    it('rejects a valid signature from a key absent from the trust root', async () => {
      const { skillMd, publicKeyPem } = buildSignedSkill({
        name: 'pdf-processing',
        publisher: 'evil.example.com',
        publicKeyRef: { url: 'https://evil.example.com/.well-known/graphorin-skill-pubkey.pem' },
      });
      _setPublicKeyFetcherForTesting(async () => publicKeyPem);
      const result = await verifySkillSignature({
        skillMd,
        trustRoot: { publishers: ['trusted.example.com'] },
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('untrusted-key');
    });

    it('accepts a valid signature whose publisher is in the trust root', async () => {
      const { skillMd, publicKeyPem } = buildSignedSkill({
        name: 'pdf-processing',
        publisher: 'trusted.example.com',
        publicKeyRef: { url: 'https://trusted.example.com/.well-known/graphorin-skill-pubkey.pem' },
      });
      _setPublicKeyFetcherForTesting(async () => publicKeyPem);
      const result = await verifySkillSignature({
        skillMd,
        trustRoot: { publishers: ['trusted.example.com'] },
      });
      expect(result.valid).toBe(true);
    });

    it('accepts a valid signature whose key fingerprint is pinned in the trust root', async () => {
      const { skillMd, publicKeyPem } = buildSignedSkill({
        name: 'pdf-processing',
        publisher: 'vendor.example.com',
        publicKeyRef: { url: 'https://vendor.example.com/.well-known/graphorin-skill-pubkey.pem' },
      });
      _setPublicKeyFetcherForTesting(async () => publicKeyPem);
      // First resolve the fingerprint the verifier computes.
      const probe = await verifySkillSignature({ skillMd });
      expect(probe.valid).toBe(true);
      const fingerprint = probe.fingerprint;
      expect(fingerprint).toBeDefined();
      const result = await verifySkillSignature({
        skillMd,
        trustRoot: { fingerprints: [fingerprint as string] },
      });
      expect(result.valid).toBe(true);
    });
  });
});
