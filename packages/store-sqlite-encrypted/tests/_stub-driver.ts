/**
 * In-memory stub of the `better-sqlite3-multiple-ciphers` driver
 * surface used by the encrypt / rekey runners.
 *
 * The stub records every PRAGMA + EXEC call so tests can assert the
 * exact wire interactions (key application, cipher PRAGMAs, ATTACH
 * + sqlcipher_export, DETACH, rekey). It also persists the
 * "encrypted" target file as a tiny JSON envelope on disk so the
 * subsequent integrity-check open call can read it back through the
 * same stub driver.
 *
 * Used by every test file in this package that needs to exercise the
 * encrypt / rekey runners without the native cipher addon.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export interface StubDriverHistory {
  readonly path: string;
  readonly pragmas: string[];
  readonly execs: string[];
  readonly attached: Map<string, { readonly path: string; readonly key: string }>;
}

const HISTORIES = new Map<string, StubDriverHistory>();

export function getStubHistory(path: string): StubDriverHistory | undefined {
  return HISTORIES.get(path);
}

export function clearStubHistory(): void {
  HISTORIES.clear();
}

interface StubFileState {
  readonly version: 1;
  readonly key: string;
  readonly cipher: string;
  readonly attachedFromUnencrypted: boolean;
  readonly integrity: 'ok' | 'failed';
}

function readStubFile(path: string): StubFileState | null {
  if (path === ':memory:') return null;
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf8');
    if (raw.startsWith('STUB_ENCRYPTED:')) {
      return JSON.parse(raw.slice('STUB_ENCRYPTED:'.length)) as StubFileState;
    }
  } catch {
    return null;
  }
  return null;
}

function writeStubFile(path: string, state: StubFileState): void {
  writeFileSync(path, `STUB_ENCRYPTED:${JSON.stringify(state)}`);
}

export interface StubDriverInstance {
  open: boolean;
  inTransaction: boolean;
  readonly path: string;
  readonly history: StubDriverHistory;
  pragma(stmt: string, options?: { simple?: boolean }): unknown;
  exec(query: string): void;
  prepare(): never;
  transaction<T extends (...args: unknown[]) => unknown>(fn: T): T;
  close(): void;
  loadExtension(): void;
}

/**
 * Builds a fresh stub-driver constructor. Each constructor maintains
 * its own history bucket so multi-DB tests do not cross-contaminate.
 */
export function buildStubDriver(opts: { failIntegrity?: boolean } = {}): {
  readonly Ctor: new (path: string) => StubDriverInstance;
  readonly histories: Map<string, StubDriverHistory>;
} {
  const histories = new Map<string, StubDriverHistory>();
  return {
    histories,
    Ctor: class StubDriverInstance {
      open = true;
      inTransaction = false;
      readonly path: string;
      #cipher: string | null = null;
      #key: string | null = null;
      #attachedKey: string | null = null;
      #attachedPath: string | null = null;
      #attachedCipher: string | null = null;
      readonly history: StubDriverHistory;

      constructor(path: string) {
        this.path = path;
        const existing = HISTORIES.get(path);
        if (existing !== undefined) {
          this.history = existing;
        } else {
          this.history = {
            path,
            pragmas: [],
            execs: [],
            attached: new Map(),
          };
          HISTORIES.set(path, this.history);
          histories.set(path, this.history);
        }
        const persisted = readStubFile(path);
        if (persisted !== null) {
          // Pretend the file is already keyed; PRAGMA key on first
          // open will be checked against this state.
        }
      }

      pragma(stmt: string, _options?: { simple?: boolean }): unknown {
        this.history.pragmas.push(stmt);
        const trimmed = stmt.trim().replace(/;$/, '');
        if (trimmed === 'page_size') return 4096;
        if (trimmed === 'wal_checkpoint(PASSIVE)') return [{ busy: 0, log: 0, checkpointed: 0 }];
        if (trimmed === 'cipher_integrity_check') {
          // Real-peer faithful: sqlite3mc has no such pragma - it
          // returns an empty row-set (CS-7).
          return [];
        }
        if (trimmed === 'integrity_check') {
          if (opts.failIntegrity === true) return [{ integrity_check: 'page 4: bad hmac' }];
          const persisted = readStubFile(this.path);
          if (persisted !== null && persisted.integrity === 'failed') {
            return [{ integrity_check: 'persisted failure' }];
          }
          return [{ integrity_check: 'ok' }];
        }
        if (trimmed.startsWith('wal_checkpoint')) {
          return [{ busy: 0, log: 0, checkpointed: 0 }];
        }
        if (trimmed === 'user_version') return 0;
        const keyMatch = /^key\s*=\s*(.+)$/.exec(trimmed);
        if (keyMatch) {
          this.#key = keyMatch[1] ?? null;
          return null;
        }
        const rekeyMatch = /^rekey\s*=\s*(.+)$/.exec(trimmed);
        if (rekeyMatch) {
          // Real-peer faithful: `PRAGMA rekey` re-keys a keyed DB AND
          // encrypts a plaintext DB in place (no prior key needed) -
          // the CS-7 copy+rekey export path relies on the latter.
          this.#key = rekeyMatch[1] ?? null;
          writeStubFile(this.path, {
            version: 1,
            key: this.#key ?? '',
            cipher: this.#cipher ?? 'sqlcipher',
            attachedFromUnencrypted: false,
            integrity: 'ok',
          });
          return null;
        }
        const encKeyMatch = /^enc\.key\s*=\s*(.+)$/.exec(trimmed);
        if (encKeyMatch) {
          this.#attachedKey = encKeyMatch[1] ?? null;
          return null;
        }
        const encCipherMatch = /^enc\.cipher\s*=\s*'([^']+)'$/.exec(trimmed);
        if (encCipherMatch) {
          this.#attachedCipher = encCipherMatch[1] ?? null;
          return null;
        }
        const cipherMatch = /^cipher\s*=\s*'([^']+)'$/.exec(trimmed);
        if (cipherMatch) {
          this.#cipher = cipherMatch[1] ?? null;
          return null;
        }
        return null;
      }

      exec(query: string): void {
        this.history.execs.push(query);
        // ATTACH DATABASE '<path>' AS enc KEY '<key>';
        const attach = /ATTACH DATABASE '([^']*(?:''[^']*)*)' AS enc KEY (.+?);/i.exec(query);
        if (attach !== null) {
          this.#attachedPath = (attach[1] ?? '').replace(/''/g, "'");
          this.#attachedKey = attach[2]?.trim() ?? null;
          this.history.attached.set('enc', {
            path: this.#attachedPath,
            key: this.#attachedKey ?? '',
          });
          return;
        }
        if (/sqlcipher_export/i.test(query)) {
          // Real-peer faithful: sqlite3mc ships no sqlcipher_export.
          throw new Error('no such function: sqlcipher_export');
        }
        if (/DETACH DATABASE enc/i.test(query)) {
          this.#attachedPath = null;
          this.#attachedKey = null;
          this.#attachedCipher = null;
          return;
        }
      }

      prepare(): never {
        // Not used by encrypt / rekey runners.
        return {} as never;
      }

      transaction<T extends (...args: unknown[]) => unknown>(fn: T): T {
        return fn;
      }

      /**
       * store-05: the encrypt runner copies via the driver's online
       * backup API. The stub mirrors better-sqlite3's semantics with a
       * plain byte copy (page-consistency is the REAL driver's
       * concern; real-peer.test.ts covers it).
       */
      async backup(destinationPath: string): Promise<void> {
        if (existsSync(this.path)) {
          writeFileSync(destinationPath, readFileSync(this.path));
        } else {
          writeFileSync(destinationPath, '');
        }
      }

      close(): void {
        this.open = false;
      }

      loadExtension(): void {}
    },
  };
}
