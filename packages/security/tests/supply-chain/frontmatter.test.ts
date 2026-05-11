import { describe, expect, it } from 'vitest';

import {
  canonicalizeForSignature,
  extractSignatureBlock,
  parseFrontmatter,
  SkillManifestParseError,
  splitFrontmatter,
} from '../../src/supply-chain/index.js';

describe('@graphorin/security/supply-chain — frontmatter helpers', () => {
  it('splits frontmatter and body', () => {
    const skillMd = '---\nname: foo\n---\n# body\n';
    const out = splitFrontmatter(skillMd);
    expect(out.frontmatter.trim()).toBe('name: foo');
    expect(out.body).toBe('# body\n');
  });

  it('throws when the frontmatter is missing', () => {
    expect(() => splitFrontmatter('# body')).toThrow(SkillManifestParseError);
  });

  it('parses signature blocks of every supported kind', () => {
    const wellKnown = parseFrontmatter(
      [
        'name: x',
        'graphorin-signature:',
        '  algorithm: ed25519-sha256',
        '  publisher: a.example.com',
        '  publishedAt: 2026-01-01',
        '  signature: deadbeef',
        '  publicKeyRef:',
        '    kind: well-known',
        '    url: https://a.example.com/pubkey.pem',
      ].join('\n'),
    );
    const block = extractSignatureBlock(wellKnown);
    expect(block?.publicKeyRef.kind).toBe('well-known');

    const inline = parseFrontmatter(
      [
        'name: x',
        'graphorin-signature:',
        '  algorithm: ed25519-sha256',
        '  publisher: a.example.com',
        '  publishedAt: 2026-01-01',
        '  signature: deadbeef',
        '  publicKeyRef:',
        '    kind: inline',
        '    publicKeyPem: |',
        '      -----BEGIN PUBLIC KEY-----',
        '      AAAA',
        '      -----END PUBLIC KEY-----',
      ].join('\n'),
    );
    const inlineBlock = extractSignatureBlock(inline);
    expect(inlineBlock?.publicKeyRef.kind).toBe('inline');
  });

  it('rejects unknown algorithms', () => {
    const parsed = parseFrontmatter(
      [
        'graphorin-signature:',
        '  algorithm: rsa-sha256',
        '  publisher: a',
        '  publishedAt: 2026-01-01',
        '  signature: deadbeef',
        '  publicKeyRef: { kind: inline, publicKeyPem: dummy }',
      ].join('\n'),
    );
    expect(() => extractSignatureBlock(parsed)).toThrow(SkillManifestParseError);
  });

  it('produces deterministic canonical bytes regardless of key order', () => {
    const a = '---\nz_field: 1\nname: same\n---\n# body\n';
    const b = '---\nname: same\nz_field: 1\n---\n# body\n';
    const ca = canonicalizeForSignature(a).canonicalText;
    const cb = canonicalizeForSignature(b).canonicalText;
    expect(ca).toBe(cb);
  });

  it('strips the signature block before canonicalising', () => {
    const skillMd = [
      '---',
      'name: x',
      'graphorin-signature:',
      '  algorithm: ed25519-sha256',
      '  publisher: vendor',
      '  publishedAt: 2026-01-01',
      '  signature: deadbeef',
      '  publicKeyRef: { kind: inline, publicKeyPem: dummy }',
      '---',
      '# body',
    ].join('\n');
    const canonical = canonicalizeForSignature(skillMd).canonicalText;
    expect(canonical).not.toContain('graphorin-signature');
    expect(canonical).toContain('name: x');
  });

  it('parses sigstore signature blocks', () => {
    const parsed = parseFrontmatter(
      [
        'graphorin-signature:',
        '  algorithm: ed25519-sha256',
        '  publisher: vendor.example.com',
        '  publishedAt: 2026-04-19T12:00:00Z',
        '  signature: deadbeef',
        '  publicKeyRef:',
        '    kind: sigstore',
        '    identity: vendor@example.com',
        '    issuer: https://accounts.example.com',
      ].join('\n'),
    );
    const block = extractSignatureBlock(parsed);
    expect(block?.publicKeyRef.kind).toBe('sigstore');
  });

  it('returns null for missing signature block', () => {
    expect(extractSignatureBlock({ name: 'x' })).toBeNull();
  });

  it('rejects non-object signature blocks', () => {
    expect(() => extractSignatureBlock({ 'graphorin-signature': 'oops' })).toThrow(
      SkillManifestParseError,
    );
  });

  it('rejects unknown publicKeyRef kinds', () => {
    expect(() =>
      extractSignatureBlock({
        'graphorin-signature': {
          algorithm: 'ed25519-sha256',
          publisher: 'p',
          publishedAt: 't',
          signature: 's',
          publicKeyRef: { kind: 'unknown' },
        },
      }),
    ).toThrow(SkillManifestParseError);
  });

  it('throws on malformed yaml frontmatter', () => {
    expect(() => parseFrontmatter(': : :\n  foo')).toThrow(SkillManifestParseError);
  });

  it('throws when frontmatter parses to a non-object', () => {
    expect(() => parseFrontmatter('"a string"')).toThrow(SkillManifestParseError);
  });
});
