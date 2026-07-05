import { describe, expect, it } from 'vitest';
import {
  effectiveAcceptsSensitivity,
  partitionBySensitivity,
  privacyDecide,
} from '../src/index.js';

describe('context-engine - privacy filter (D2; Phase 10d)', () => {
  it("'public' content always passes regardless of trust class", () => {
    expect(privacyDecide('public', { providerTrust: 'public-tls' }).decision).toBe('pass');
    expect(privacyDecide('public', { providerTrust: 'loopback' }).decision).toBe('pass');
  });

  it("'secret' content drops for non-loopback providers", () => {
    expect(privacyDecide('secret', { providerTrust: 'public-tls' }).decision).toBe('drop');
    expect(privacyDecide('secret', { providerTrust: 'private' }).decision).toBe('drop');
  });

  it("'secret' content can pass on loopback when explicitly accepted", () => {
    expect(
      privacyDecide('secret', {
        providerTrust: 'loopback',
        providerAcceptsSensitivity: ['public', 'internal', 'secret'],
      }).decision,
    ).toBe('pass');
  });

  it("'internal' content drops on cloud-tier when cloudUploadConsent is false", () => {
    const out = privacyDecide('internal', {
      providerTrust: 'public-tls',
      cloudUploadConsent: false,
    });
    // public-tls default acceptsSensitivity is just ['public'], so it
    // is rejected by the provider tier first (provider-rejects-internal).
    expect(out.decision).toBe('drop');
    expect(out.reason).toBe('provider-rejects-internal');
  });

  it("'internal' content drops with no-cloud-upload-consent reason on private when consent missing", () => {
    const out = privacyDecide('internal', {
      providerTrust: 'public-tls',
      cloudUploadConsent: false,
      providerAcceptsSensitivity: ['public', 'internal'],
    });
    expect(out.decision).toBe('drop');
    expect(out.reason).toBe('no-cloud-upload-consent');
  });

  it("'internal' content passes on loopback regardless of consent", () => {
    expect(
      privacyDecide('internal', {
        providerTrust: 'loopback',
      }).decision,
    ).toBe('pass');
  });

  it("'internal' content passes when cloudUploadConsent: true and provider accepts", () => {
    const out = privacyDecide('internal', {
      providerTrust: 'public-tls',
      cloudUploadConsent: true,
      providerAcceptsSensitivity: ['public', 'internal'],
    });
    expect(out.decision).toBe('pass');
    expect(out.reason).toBe('allowed');
  });

  it('per-provider override always wins over the trust-class defaults', () => {
    expect(effectiveAcceptsSensitivity({ providerTrust: 'public-tls' })).toEqual(['public']);
    expect(
      effectiveAcceptsSensitivity({
        providerTrust: 'public-tls',
        providerAcceptsSensitivity: ['public', 'internal', 'secret'],
      }),
    ).toEqual(['public', 'internal', 'secret']);
  });

  it('partition counts decisions per reason', () => {
    const records = [
      { id: 'a', sensitivity: 'public' as const },
      { id: 'b', sensitivity: 'secret' as const },
      { id: 'c', sensitivity: 'internal' as const },
      { id: 'd', sensitivity: 'internal' as const },
    ];
    const out = partitionBySensitivity(records, {
      providerTrust: 'public-tls',
      cloudUploadConsent: false,
    });
    expect(out.kept.map((r) => r.id)).toEqual(['a']);
    expect(out.counters.allowed).toBe(1);
    expect(out.counters['provider-rejects-secret']).toBe(1);
    expect(out.counters['provider-rejects-internal']).toBe(2);
  });
});
