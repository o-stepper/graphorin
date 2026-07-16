/**
 * Audit 2026-07-16 P1-3: on a pnpm-10 consumer install that skipped the
 * native build scripts, `better-sqlite3` is present but its binding is
 * not - the first open used to die with a raw `bindings.js` stack. The
 * driver loaders rethrow that failure as the actionable
 * `SqliteNativeBindingError` instead.
 */
import { describe, expect, it, vi } from 'vitest';

import { _resetDriverCacheForTesting, openConnection } from '../src/connection.js';
import { loadCipherDriver } from '../src/encryption/index.js';
import {
  isMissingNativeBindingError,
  SqliteNativeBindingError,
} from '../src/native-binding-error.js';

const BINDINGS_MESSAGE =
  'Could not locate the bindings file. Tried:\n' +
  ' -> /app/node_modules/better-sqlite3/build/better_sqlite3.node';

vi.mock('better-sqlite3', () => {
  throw new Error(BINDINGS_MESSAGE);
});
vi.mock('better-sqlite3-multiple-ciphers', () => {
  throw new Error(BINDINGS_MESSAGE);
});

describe('SqliteNativeBindingError - skipped-build interception', () => {
  it('openConnection maps the bindings failure onto the actionable error', async () => {
    _resetDriverCacheForTesting();
    const failure = await openConnection({ path: ':memory:' }).then(
      () => undefined,
      (err: unknown) => err,
    );
    expect(failure).toBeInstanceOf(SqliteNativeBindingError);
    const err = failure as SqliteNativeBindingError;
    expect(err.packageName).toBe('better-sqlite3');
    expect(err.kind).toBe('sqlite-native-binding');
    expect(err.message).toContain('onlyBuiltDependencies');
    expect(err.message).toContain('pnpm approve-builds');
  });

  it('loadCipherDriver reports skipped-build, not a missing peer', async () => {
    const failure = await loadCipherDriver().then(
      () => undefined,
      (err: unknown) => err,
    );
    expect(failure).toBeInstanceOf(SqliteNativeBindingError);
    expect((failure as SqliteNativeBindingError).packageName).toBe(
      'better-sqlite3-multiple-ciphers',
    );
  });
});

describe('isMissingNativeBindingError', () => {
  it('matches the bindings locator message, directly and through cause links', () => {
    expect(isMissingNativeBindingError(new Error(BINDINGS_MESSAGE))).toBe(true);
    expect(
      isMissingNativeBindingError(
        new Error('import failed', { cause: new Error(BINDINGS_MESSAGE) }),
      ),
    ).toBe(true);
  });

  it('does not match unrelated import failures', () => {
    expect(isMissingNativeBindingError(new Error("Cannot find package 'better-sqlite3'"))).toBe(
      false,
    );
    expect(isMissingNativeBindingError(undefined)).toBe(false);
    expect(isMissingNativeBindingError('Could not locate the bindings file')).toBe(false);
  });
});
