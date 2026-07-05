import { describe, expect, it } from 'vitest';

import {
  AuditChainBrokenError,
  AuditDbCipherUnavailableError,
  AuditPayloadSerializationError,
} from '../../src/audit/errors.js';

describe('@graphorin/security/audit - errors', () => {
  it('AuditDbCipherUnavailableError carries the binding id and a hint', () => {
    const err = new AuditDbCipherUnavailableError('better-sqlite3-multiple-ciphers');
    expect(err.kind).toBe('audit-db-cipher-unavailable');
    expect(err.binding).toBe('better-sqlite3-multiple-ciphers');
    expect(err.hint).toContain('@graphorin/store-sqlite');
  });

  it('AuditChainBrokenError surfaces the divergent seq', () => {
    const err = new AuditChainBrokenError(7, 'expected-hash', 'actual-hash');
    expect(err.kind).toBe('audit-chain-broken');
    expect(err.seq).toBe(7);
    expect(err.expectedHash).toBe('expected-hash');
    expect(err.actualHash).toBe('actual-hash');
    expect(err.message).toContain('seq 7');
  });

  it('AuditPayloadSerializationError points at the canonical-JSON contract', () => {
    const err = new AuditPayloadSerializationError('cyclic reference');
    expect(err.kind).toBe('audit-payload-serialization');
    expect(err.hint).toContain('JSON-compatible');
  });
});
