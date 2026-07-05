import { afterEach, describe, expect, it } from 'vitest';

import {
  _resetAuditDbBindingsForTesting,
  getDefaultAuditDbBinding,
  listAuditDbBindings,
  openAuditDb,
  registerAuditDbBinding,
} from '../../src/audit/audit-db.js';
import { AuditDbCipherUnavailableError } from '../../src/audit/errors.js';
import { SecretValue } from '../../src/secrets/secret-value.js';

import { createMemoryAuditDbBinding } from './_helpers.js';

describe('@graphorin/security/audit - audit-db lifecycle', () => {
  afterEach(() => {
    _resetAuditDbBindingsForTesting();
  });

  it('refuses to open when no binding is registered', async () => {
    await expect(
      openAuditDb({
        path: '/tmp/audit.db',
        passphrase: SecretValue.fromString('passphrase'),
      }),
    ).rejects.toBeInstanceOf(AuditDbCipherUnavailableError);
  });

  it('refuses to open when the requested binding id is unknown', async () => {
    registerAuditDbBinding(createMemoryAuditDbBinding('memory'));
    await expect(
      openAuditDb({
        path: '/tmp/audit.db',
        passphrase: SecretValue.fromString('passphrase'),
        binding: 'better-sqlite3-multiple-ciphers',
      }),
    ).rejects.toBeInstanceOf(AuditDbCipherUnavailableError);
  });

  it('opens against a registered binding and returns the binding id', async () => {
    registerAuditDbBinding(createMemoryAuditDbBinding('memory'));
    const db = await openAuditDb({
      path: '/tmp/audit.db',
      passphrase: SecretValue.fromString('passphrase'),
    });
    expect(db.binding).toBe('memory');
  });

  it('listAuditDbBindings reflects registration', () => {
    registerAuditDbBinding(createMemoryAuditDbBinding('memory'));
    const list = listAuditDbBindings();
    expect(list.length).toBe(1);
    expect(list[0]?.id).toBe('memory');
    expect(list[0]?.isDefault).toBe(true);
  });

  it('teardown removes the binding from the registry', () => {
    const teardown = registerAuditDbBinding(createMemoryAuditDbBinding('memory'));
    teardown();
    expect(listAuditDbBindings().length).toBe(0);
    expect(getDefaultAuditDbBinding()).toBeUndefined();
  });

  it('keeps the first registered binding as default unless setAsDefault is true', () => {
    registerAuditDbBinding(createMemoryAuditDbBinding('memory-a'));
    registerAuditDbBinding(createMemoryAuditDbBinding('memory-b'));
    expect(getDefaultAuditDbBinding()).toBe('memory-a');
    registerAuditDbBinding(createMemoryAuditDbBinding('memory-c'), { setAsDefault: true });
    expect(getDefaultAuditDbBinding()).toBe('memory-c');
  });
});
