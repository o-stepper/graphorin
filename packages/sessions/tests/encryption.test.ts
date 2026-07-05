import testPkg from '../package.json' with { type: 'json' };

const pkgVersion: string = testPkg.version;

import { describe, expect, it } from 'vitest';
import { SessionExportEncryptionRequiredError } from '../src/errors/index.js';
import {
  createBufferSink,
  createSessionExportWriter,
  decryptBody,
  deriveSessionExportKey,
  encryptBody,
  readSessionExport,
} from '../src/export/index.js';

describe('Session export AES-256-GCM helpers', () => {
  it('round-trips a body via encryptBody / decryptBody', async () => {
    const passphrase = new TextEncoder().encode('correct-horse-battery-staple');
    const salt = new TextEncoder().encode('graphorin-salt-1234567890abcdef');
    const key = await deriveSessionExportKey(passphrase, salt);
    const plaintext = new TextEncoder().encode(
      '{"kind":"meta","format":"graphorin-session-export","version":"1.0","createdAt":"2026-05-08T10:00:00Z","writer":"test","minRuntimeVersion":"0.1.0"}\n{"kind":"footer","recordCount":2,"messageCount":0,"handoffCount":0,"agentCount":0,"writtenAtIso":"2026-05-08T10:00:00Z"}\n',
    );
    const ciphertext = encryptBody(plaintext, key);
    expect(ciphertext.length).toBeGreaterThan(plaintext.length);
    expect(ciphertext.length).toBe(plaintext.length + 12 + 16);
    const decrypted = decryptBody(ciphertext, key);
    expect(new TextDecoder().decode(decrypted)).toBe(new TextDecoder().decode(plaintext));
  });

  it('wraps an actual JSONL export through encrypt / decrypt and re-parses correctly', async () => {
    const buffer = createBufferSink();
    const writer = createSessionExportWriter(buffer.sink, {
      writer: `@graphorin/sessions@${pkgVersion}`,
      hash: true,
    });
    await writer.writeRecord({
      kind: 'session',
      id: 'sess-encrypted',
      userId: 'u-1',
      agentId: 'main',
      createdAt: '2026-05-08T10:00:00Z',
    });
    await writer.close();
    const body = buffer.toString();
    const passphrase = new TextEncoder().encode('top-secret-pass');
    const salt = new TextEncoder().encode('graphorin-salt-9876543210fedcba');
    const key = await deriveSessionExportKey(passphrase, salt);
    const ciphertext = encryptBody(new TextEncoder().encode(body), key);
    const decrypted = decryptBody(ciphertext, key);
    const restored = new TextDecoder().decode(decrypted);
    expect(restored).toBe(body);
    const parsed = readSessionExport(restored);
    expect(parsed.records[0]?.kind).toBe('session');
    expect(parsed.footer.checksum).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('writer.encrypt encrypts the body inline; reader restores with the key, throws without (RP-1)', async () => {
    const salt = new TextEncoder().encode('graphorin-salt-rp1-00000000000000');
    const key = await deriveSessionExportKey('top-secret-pass', salt);
    const buffer = createBufferSink();
    const writer = createSessionExportWriter(buffer.sink, {
      writer: `@graphorin/sessions@${pkgVersion}`,
      hash: true,
      encrypt: { key },
    });
    await writer.writeRecord({
      kind: 'session',
      id: 'sess-secret-xyz',
      userId: 'u-1',
      agentId: 'main',
      createdAt: '2026-05-08T10:00:00Z',
    });
    const footer = await writer.close();
    const body = buffer.toString();

    // The record's secret content must NOT survive as plaintext.
    expect(body).not.toContain('sess-secret-xyz');
    expect(footer.cipher).toBe('aes256gcm');

    // Reader WITH the key restores the original record.
    const parsed = readSessionExport(body, { decryptionKey: key });
    expect(parsed.records[0]?.kind).toBe('session');
    expect((parsed.records[0] as { id?: string }).id).toBe('sess-secret-xyz');

    // Reader WITHOUT the key throws the typed error instead of mis-parsing.
    expect(() => readSessionExport(body)).toThrow(SessionExportEncryptionRequiredError);
  });

  it('a non-encrypted export stamps no cipher on the footer (RP-1)', async () => {
    const buffer = createBufferSink();
    const writer = createSessionExportWriter(buffer.sink, { writer: 'w' });
    await writer.writeRecord({
      kind: 'session',
      id: 's',
      userId: 'u',
      agentId: 'a',
      createdAt: '2026-05-08T10:00:00Z',
    });
    const footer = await writer.close();
    expect(footer.cipher).toBeUndefined();
    expect(buffer.toString()).toContain('"id":"s"'); // plaintext, as expected
  });

  it('rejects ciphertext with a corrupted auth tag', async () => {
    const passphrase = new TextEncoder().encode('pass-1');
    const salt = new TextEncoder().encode('salt-12345678901234567890123456');
    const key = await deriveSessionExportKey(passphrase, salt);
    const plaintext = new TextEncoder().encode('hello world');
    const ciphertext = encryptBody(plaintext, key);
    // Corrupt the last byte (part of the auth tag).
    ciphertext[ciphertext.length - 1] = (ciphertext[ciphertext.length - 1] ?? 0) ^ 0xff;
    expect(() => decryptBody(ciphertext, key)).toThrow();
  });
});
