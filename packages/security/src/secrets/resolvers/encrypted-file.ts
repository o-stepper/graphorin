import { createDecipheriv } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

import type { SecretResolver, SecretResolverContext } from '@graphorin/core/contracts';

import { MissingPeerDependencyError, SecretResolutionError } from '../errors.js';
import { getQueryParam, type ParsedSecretRef } from '../secret-ref.js';
import { SecretValue } from '../secret-value.js';
import { resolveSecret } from './registry.js';

/**
 * On-disk format of an encrypted bundle:
 *
 * ```text
 * [4 bytes] magic version (0x01000000 little-endian)
 * [16 bytes] Argon2id salt (random per bundle)
 * [12 bytes] AES-256-GCM nonce (random per bundle)
 * [N bytes]  AES-256-GCM ciphertext
 * [16 bytes] AES-256-GCM authentication tag
 * ```
 *
 * The ciphertext, once decrypted, is UTF-8 JSON of the shape
 * `{ values: Record<string, string>, meta: { createdAt: string } }`.
 *
 * The bundle is read end-to-end, decrypted with the passphrase derived
 * via Argon2id, and the requested fragment (`#field`) is selected from
 * the values map. JSON-pointer style fragments (`#/path/to/field`) are
 * supported for nested objects (post-MVP).
 *
 * @stable
 */
export const ENCRYPTED_FILE_MAGIC = 0x01_00_00_00;

const MAGIC_BYTES = 4;
const SALT_BYTES = 16;
const NONCE_BYTES = 12;
const TAG_BYTES = 16;
const AES_KEY_BYTES = 32;

/**
 * Argon2id KDF parameters aligned with OWASP Password Storage Cheat
 * Sheet 2024+ recommendations for server contexts.
 */
export const ARGON2ID_PARAMS = Object.freeze({
  memoryCostKiB: 65536, // m=64MiB
  timeCost: 3, // t=3
  parallelism: 1, // p=1
});

type Argon2idFn = (
  password: Buffer | string,
  options: {
    salt: Buffer;
    memoryCost: number;
    timeCost: number;
    parallelism: number;
    outputLen: number;
  },
) => Promise<Buffer>;

let argon2idCache: Argon2idFn | null = null;
let argon2idAttempted = false;

async function loadArgon2id(): Promise<Argon2idFn> {
  if (argon2idCache) return argon2idCache;
  if (argon2idAttempted && !argon2idCache) {
    throw new MissingPeerDependencyError(
      '@node-rs/argon2',
      'EncryptedFileSecretsStore / encrypted-file: SecretRef resolver',
    );
  }
  argon2idAttempted = true;
  try {
    const mod = (await import('@node-rs/argon2')) as {
      hashRaw?: Argon2idFn;
      Algorithm?: Record<string, unknown>;
    };
    if (typeof mod.hashRaw !== 'function') {
      throw new MissingPeerDependencyError(
        '@node-rs/argon2',
        'EncryptedFileSecretsStore / encrypted-file: SecretRef resolver',
      );
    }
    argon2idCache = mod.hashRaw;
    return mod.hashRaw;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND') {
      throw new MissingPeerDependencyError(
        '@node-rs/argon2',
        'EncryptedFileSecretsStore / encrypted-file: SecretRef resolver',
        { cause: err },
      );
    }
    throw err;
  }
}

/**
 * Test-only override.
 *
 * @experimental
 */
export function _setArgon2idForTesting(fn: Argon2idFn | null): void {
  argon2idCache = fn;
  argon2idAttempted = fn !== null;
}

/**
 * Derive a 32-byte AES-256-GCM key from a passphrase + salt.
 *
 * @stable
 */
export async function deriveAesKey(passphrase: Buffer | string, salt: Buffer): Promise<Buffer> {
  const argon2id = await loadArgon2id();
  return argon2id(passphrase, {
    salt,
    memoryCost: ARGON2ID_PARAMS.memoryCostKiB,
    timeCost: ARGON2ID_PARAMS.timeCost,
    parallelism: ARGON2ID_PARAMS.parallelism,
    outputLen: AES_KEY_BYTES,
  });
}

/**
 * Decrypt a raw bundle into the values map. Used by the resolver and by
 * the `EncryptedFileSecretsStore` so the wire format stays in one place.
 *
 * @stable
 */
export async function decryptBundle(
  bundle: Buffer,
  passphrase: Buffer | string,
): Promise<{ values: Record<string, unknown>; meta: Record<string, unknown> }> {
  if (bundle.length < MAGIC_BYTES + SALT_BYTES + NONCE_BYTES + TAG_BYTES + 1) {
    throw new SecretResolutionError(
      'encrypted-file',
      '<bundle>',
      `Bundle is too small (${bundle.length} bytes) to contain a valid header.`,
    );
  }
  const magic = bundle.readUInt32LE(0);
  if (magic !== ENCRYPTED_FILE_MAGIC) {
    throw new SecretResolutionError(
      'encrypted-file',
      '<bundle>',
      `Bundle has unknown magic 0x${magic.toString(16).padStart(8, '0')} (expected 0x${ENCRYPTED_FILE_MAGIC.toString(16).padStart(8, '0')}).`,
    );
  }
  const salt = bundle.subarray(MAGIC_BYTES, MAGIC_BYTES + SALT_BYTES);
  const nonce = bundle.subarray(MAGIC_BYTES + SALT_BYTES, MAGIC_BYTES + SALT_BYTES + NONCE_BYTES);
  const tag = bundle.subarray(bundle.length - TAG_BYTES);
  const ciphertext = bundle.subarray(
    MAGIC_BYTES + SALT_BYTES + NONCE_BYTES,
    bundle.length - TAG_BYTES,
  );

  const key = await deriveAesKey(passphrase, salt);
  let plaintext: Buffer;
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAuthTag(tag);
    plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch (err) {
    throw new SecretResolutionError(
      'encrypted-file',
      '<bundle>',
      'Authentication tag mismatch - bundle is tampered, truncated, or the passphrase is wrong.',
      { cause: err },
    );
  } finally {
    key.fill(0);
  }
  let parsed: { values: Record<string, unknown>; meta: Record<string, unknown> };
  try {
    parsed = JSON.parse(plaintext.toString('utf8'));
  } catch (err) {
    throw new SecretResolutionError(
      'encrypted-file',
      '<bundle>',
      `Bundle plaintext is not valid JSON: ${(err as Error).message}`,
      { cause: err },
    );
  } finally {
    plaintext.fill(0);
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof parsed.values !== 'object' ||
    parsed.values === null
  ) {
    throw new SecretResolutionError(
      'encrypted-file',
      '<bundle>',
      'Bundle plaintext does not match the expected shape: { values, meta }.',
    );
  }
  return {
    values: parsed.values,
    meta: typeof parsed.meta === 'object' && parsed.meta !== null ? parsed.meta : {},
  };
}

function expandTilde(p: string): string {
  if (p === '~') return homedir();
  if (p.startsWith('~/')) return resolve(homedir(), p.slice(2));
  return p;
}

/**
 * Strip the leading `/` from `/C:/path/to/file` on Windows so the
 * RFC 3986 `file://` URL path (which always starts with `/`) round-
 * trips to an OS-native Windows path. See the matching helper in
 * `./file.ts` for the rationale.
 */
function stripWindowsUrlSlash(p: string): string {
  if (process.platform === 'win32' && /^\/[A-Za-z]:[\\/]/.test(p)) {
    return p.slice(1);
  }
  return p;
}

/**
 * Look up a value inside the bundle by JSON-pointer-or-shorthand
 * fragment. `#field` is shorthand for `/field`; `#/path/to/field`
 * walks nested objects per RFC 6901.
 */
function selectFragment(
  values: Record<string, unknown>,
  fragment: string | undefined,
  raw: string,
): string {
  if (!fragment) {
    throw new SecretResolutionError(
      'encrypted-file',
      raw,
      "encrypted-file: ref must include a '#field' selector.",
    );
  }
  const path = fragment.startsWith('/') ? fragment.split('/').slice(1) : [fragment];
  let cursor: unknown = values;
  for (const piece of path) {
    if (typeof cursor !== 'object' || cursor === null) {
      throw new SecretResolutionError(
        'encrypted-file',
        raw,
        `Fragment '${fragment}' walked into a non-object at '${piece}'.`,
      );
    }
    const decoded = piece.replace(/~1/g, '/').replace(/~0/g, '~');
    cursor = (cursor as Record<string, unknown>)[decoded];
    if (cursor === undefined) {
      throw new SecretResolutionError(
        'encrypted-file',
        raw,
        `Fragment '${fragment}' did not match a value in the bundle.`,
      );
    }
  }
  if (typeof cursor !== 'string') {
    throw new SecretResolutionError(
      'encrypted-file',
      raw,
      `Fragment '${fragment}' resolved to a ${typeof cursor}; expected a string.`,
    );
  }
  return cursor;
}

/**
 * Resolver for `encrypted-file:` SecretRefs.
 *
 * @stable
 */
export const encryptedFileResolver: SecretResolver = {
  scheme: 'encrypted-file',
  async resolve(ref, ctx?: SecretResolverContext) {
    const parsed = ref as ParsedSecretRef;
    if (parsed.path.length === 0) {
      throw new SecretResolutionError(
        'encrypted-file',
        parsed.raw,
        "encrypted-file: ref must include a path (e.g. 'encrypted-file:/path/secrets.kse#openai').",
      );
    }
    const passphraseRef = getQueryParam(parsed, 'key');
    let passphraseValue: SecretValue | null = null;
    if (passphraseRef) {
      passphraseValue = await resolveSecret(passphraseRef, ctx);
    } else if (process.env.GRAPHORIN_MASTER_PASSPHRASE) {
      passphraseValue = SecretValue.fromString(process.env.GRAPHORIN_MASTER_PASSPHRASE, {
        source: { resolver: 'env', ref: 'env:GRAPHORIN_MASTER_PASSPHRASE' },
      });
    } else if (process.env.GRAPHORIN_MASTER_PASSPHRASE_FILE) {
      const envPath = process.env.GRAPHORIN_MASTER_PASSPHRASE_FILE;
      const passphraseBytes = await readFile(expandTilde(envPath));
      passphraseValue = SecretValue.fromBuffer(passphraseBytes, {
        source: { resolver: 'file', ref: `file:${envPath}` },
      });
    } else {
      throw new SecretResolutionError(
        'encrypted-file',
        parsed.raw,
        "encrypted-file: ref requires a passphrase. Provide '?key=<SecretRef>' or set GRAPHORIN_MASTER_PASSPHRASE / GRAPHORIN_MASTER_PASSPHRASE_FILE.",
      );
    }

    let bundle: Buffer;
    try {
      bundle = await readFile(expandTilde(stripWindowsUrlSlash(parsed.path)));
    } catch (err) {
      throw new SecretResolutionError(
        'encrypted-file',
        parsed.raw,
        (err as Error).message ?? 'read failed',
        { cause: err },
      );
    }

    let plain: { values: Record<string, unknown> };
    try {
      plain = await passphraseValue.useBuffer(async (passBuf) => decryptBundle(bundle, passBuf));
    } finally {
      passphraseValue.dispose();
    }

    const value = selectFragment(plain.values, parsed.fragment, parsed.raw);
    return SecretValue.fromString(value, {
      source: { resolver: 'encrypted-file', ref: parsed.raw },
    });
  },
};
