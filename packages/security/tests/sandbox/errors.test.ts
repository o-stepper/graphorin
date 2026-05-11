import { describe, expect, it } from 'vitest';

import {
  GraphorinSandboxError,
  MandatorySandboxOverrideError,
  SandboxFsAccessDeniedError,
  SandboxNetworkAccessDeniedError,
  SandboxPeerUnavailableError,
  UnsupportedSandboxKindError,
} from '../../src/sandbox/errors.js';
import { GraphorinSecretsError } from '../../src/secrets/errors.js';

describe('sandbox errors', () => {
  it('UnsupportedSandboxKindError carries the available list and inherits the security base', () => {
    const err = new UnsupportedSandboxKindError('rust-vm', ['none', 'worker-threads']);
    expect(err).toBeInstanceOf(GraphorinSandboxError);
    expect(err).toBeInstanceOf(GraphorinSecretsError);
    expect(err.kind).toBe('unsupported-sandbox-kind');
    expect(err.available).toEqual(['none', 'worker-threads']);
    expect(err.message).toContain('rust-vm');
  });

  it('SandboxPeerUnavailableError exposes the install command via .hint', () => {
    const err = new SandboxPeerUnavailableError(
      'IsolatedVMSandbox',
      'isolated-vm',
      'pnpm add isolated-vm',
    );
    expect(err.kind).toBe('sandbox-peer-unavailable');
    expect(err.hint).toBe('pnpm add isolated-vm');
    expect(err.installCommand).toBe('pnpm add isolated-vm');
  });

  it('MandatorySandboxOverrideError describes the rejected override', () => {
    const err = new MandatorySandboxOverrideError('untrusted', 'none', 'worker-threads');
    expect(err.kind).toBe('mandatory-sandbox-override');
    expect(err.message).toContain('untrusted');
    expect(err.message).toContain('worker-threads');
  });

  it('SandboxFsAccessDeniedError + SandboxNetworkAccessDeniedError carry the optional target', () => {
    const fs = new SandboxFsAccessDeniedError('/etc/passwd');
    const net = new SandboxNetworkAccessDeniedError('attacker.example');
    expect(fs.kind).toBe('sandbox-fs-access-denied');
    expect(fs.attemptedPath).toBe('/etc/passwd');
    expect(net.kind).toBe('sandbox-network-access-denied');
    expect(net.attemptedHost).toBe('attacker.example');

    const fsBare = new SandboxFsAccessDeniedError();
    expect(fsBare.attemptedPath).toBeUndefined();
    expect(fsBare.message).toContain('filesystem access denied');
  });
});
