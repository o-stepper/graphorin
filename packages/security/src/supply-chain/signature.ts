/**
 * ed25519 signature verification for SKILL.md.
 *
 * Uses Node's built-in `crypto.verify` so the framework does not pull
 * a third-party crypto library into the security package.
 *
 * @packageDocumentation
 */

import { Buffer } from 'node:buffer';
import { createHash, createPublicKey, verify as cryptoVerify, type KeyObject } from 'node:crypto';

import { SkillSignatureInvalidError, SkillSignatureMissingError } from './errors.js';
import {
  canonicalizeForSignature,
  extractSignatureBlock,
  parseFrontmatter,
  splitFrontmatter,
} from './frontmatter.js';
import type {
  SkillPublicKeyRef,
  SkillSignatureBlock,
  SkillSignatureVerificationResult,
} from './types.js';

/**
 * Strategy hook used by tests so the unit suite never fetches a real
 * `well-known` URL.
 *
 * @experimental
 */
export type PublicKeyFetcher = (url: string, signal?: AbortSignal) => Promise<string>;

let activeFetcher: PublicKeyFetcher | null = null;

/**
 * Override the public-key fetcher. Used by the test suite.
 *
 * @experimental
 */
export function _setPublicKeyFetcherForTesting(fetcher: PublicKeyFetcher | null): void {
  activeFetcher = fetcher;
}

/**
 * Strategy hook used by tests so the Sigstore branch can be exercised
 * without a real Fulcio + Rekor round-trip.
 *
 * @experimental
 */
export type SigstoreVerifier = (
  args: { readonly identity: string; readonly issuer: string; readonly signature: string },
  signal?: AbortSignal,
) => Promise<{ readonly publicKeyPem: string; readonly fingerprint: string }>;

let activeSigstoreVerifier: SigstoreVerifier | null = null;

/**
 * Override the Sigstore verifier. Sigstore support is opt-in; the
 * framework keeps the surface dormant until a verifier is installed.
 *
 * @experimental
 */
export function _setSigstoreVerifierForTesting(verifier: SigstoreVerifier | null): void {
  activeSigstoreVerifier = verifier;
}

/**
 * Options accepted by {@link verifySkillSignature}.
 *
 * @stable
 */
export interface VerifySkillSignatureOptions {
  /** Raw SKILL.md content (UTF-8 string). */
  readonly skillMd: string;
  /**
   * When supplied, overrides the `publicKeyRef` block discovered in
   * the frontmatter. Useful for offline verification with a pinned
   * publisher key.
   */
  readonly publicKeySource?: { readonly publicKeyPem: string; readonly publisher?: string };
  /** Cancellation. */
  readonly signal?: AbortSignal;
  /** Optional pre-installed strategy registry override. */
  readonly publicKeyFetcher?: PublicKeyFetcher;
  readonly sigstoreVerifier?: SigstoreVerifier;
}

/**
 * Verify the ed25519 signature embedded in `skillMd`. Returns a
 * structured result instead of throwing for the validation outcome —
 * callers branch on `valid`. Parser-level errors (missing block,
 * malformed YAML) are still thrown via the supply-chain error
 * hierarchy.
 *
 * @stable
 */
export async function verifySkillSignature(
  options: VerifySkillSignatureOptions,
): Promise<SkillSignatureVerificationResult> {
  const { frontmatter } = splitFrontmatter(options.skillMd);
  const parsed = parseFrontmatter(frontmatter);
  const block = extractSignatureBlock(parsed);
  const skillId =
    typeof parsed.name === 'string' && parsed.name.length > 0 ? parsed.name : 'unknown';
  if (block === null) {
    throw new SkillSignatureMissingError(skillId);
  }

  const overrideKey = options.publicKeySource?.publicKeyPem;
  const fetcher = options.publicKeyFetcher ?? activeFetcher ?? defaultFetcher;
  const sigstore = options.sigstoreVerifier ?? activeSigstoreVerifier ?? null;
  let publicKeyPem: string;
  let fingerprint: string | undefined;
  let signerId: string | undefined;
  let publicKeySource: SkillPublicKeyRef['kind'];
  if (overrideKey !== undefined) {
    publicKeyPem = overrideKey;
    publicKeySource = block.publicKeyRef.kind;
  } else {
    const ctx: {
      fetcher: PublicKeyFetcher;
      sigstore: SigstoreVerifier | null;
      signal?: AbortSignal;
    } = {
      fetcher,
      sigstore,
    };
    if (options.signal !== undefined) ctx.signal = options.signal;
    const resolved = await resolvePublicKey(block, ctx);
    publicKeyPem = resolved.publicKeyPem;
    publicKeySource = resolved.publicKeySource;
    if (resolved.fingerprint !== undefined) fingerprint = resolved.fingerprint;
    if (resolved.signerId !== undefined) signerId = resolved.signerId;
  }

  let publicKey: KeyObject;
  try {
    publicKey = createPublicKey({ key: publicKeyPem, format: 'pem' });
  } catch (err) {
    throw new SkillSignatureInvalidError(
      skillId,
      `Public key could not be parsed: ${(err as Error).message}`,
      block.publisher,
    );
  }
  if (publicKey.asymmetricKeyType !== 'ed25519') {
    throw new SkillSignatureInvalidError(
      skillId,
      `Expected an ed25519 public key, got '${publicKey.asymmetricKeyType ?? 'unknown'}'.`,
      block.publisher,
    );
  }

  const { bytes } = canonicalizeForSignature(options.skillMd);
  let signatureBytes: Buffer;
  try {
    signatureBytes = Buffer.from(block.signature, 'base64url');
    if (signatureBytes.length === 0) {
      signatureBytes = Buffer.from(block.signature, 'base64');
    }
  } catch (err) {
    throw new SkillSignatureInvalidError(
      skillId,
      `Signature could not be decoded: ${(err as Error).message}`,
      block.publisher,
    );
  }

  let valid: boolean;
  try {
    valid = cryptoVerify(null, bytes, publicKey, signatureBytes);
  } catch (err) {
    throw new SkillSignatureInvalidError(
      skillId,
      `crypto.verify threw: ${(err as Error).message}`,
      block.publisher,
    );
  }

  if (!valid) {
    return Object.freeze({
      valid: false,
      publisher: block.publisher,
      publicKeySource,
      ...(fingerprint === undefined ? {} : { fingerprint }),
      ...(signerId === undefined ? {} : { signerId }),
      reason: 'ed25519 verification failed',
    });
  }
  return Object.freeze({
    valid: true,
    publisher: block.publisher,
    publicKeySource,
    ...(fingerprint === undefined ? {} : { fingerprint }),
    ...(signerId === undefined ? {} : { signerId }),
  });
}

interface ResolvedPublicKey {
  readonly publicKeyPem: string;
  readonly publicKeySource: SkillPublicKeyRef['kind'];
  readonly fingerprint?: string;
  readonly signerId?: string;
}

async function resolvePublicKey(
  block: SkillSignatureBlock,
  ctx: {
    readonly fetcher: PublicKeyFetcher;
    readonly sigstore: SigstoreVerifier | null;
    readonly signal?: AbortSignal;
  },
): Promise<ResolvedPublicKey> {
  switch (block.publicKeyRef.kind) {
    case 'inline': {
      return {
        publicKeyPem: block.publicKeyRef.publicKeyPem,
        publicKeySource: 'inline',
        fingerprint: fingerprintPem(block.publicKeyRef.publicKeyPem),
      };
    }
    case 'well-known': {
      const pem = await ctx.fetcher(block.publicKeyRef.url, ctx.signal);
      const fp = fingerprintPem(pem);
      if (
        block.publicKeyRef.pinFingerprint !== undefined &&
        normaliseFingerprint(block.publicKeyRef.pinFingerprint) !== normaliseFingerprint(fp)
      ) {
        throw new SkillSignatureInvalidError(
          block.publisher,
          `Public-key fingerprint mismatch (expected '${block.publicKeyRef.pinFingerprint}', got '${fp}').`,
          block.publisher,
        );
      }
      return {
        publicKeyPem: pem,
        publicKeySource: 'well-known',
        fingerprint: fp,
        signerId: block.publisher,
      };
    }
    case 'sigstore': {
      if (ctx.sigstore === null) {
        throw new SkillSignatureInvalidError(
          block.publisher,
          'Sigstore verification requires an installed verifier (sigstore is opt-in).',
          block.publisher,
        );
      }
      const result = await ctx.sigstore(
        {
          identity: block.publicKeyRef.identity,
          issuer: block.publicKeyRef.issuer,
          signature: block.signature,
        },
        ctx.signal,
      );
      return {
        publicKeyPem: result.publicKeyPem,
        publicKeySource: 'sigstore',
        fingerprint: result.fingerprint,
        signerId: block.publicKeyRef.identity,
      };
    }
    default: {
      const exhaustive: never = block.publicKeyRef;
      void exhaustive;
      throw new SkillSignatureInvalidError(
        block.publisher,
        'Unknown publicKeyRef.kind.',
        block.publisher,
      );
    }
  }
}

function fingerprintPem(pem: string): string {
  const der = pemToDer(pem);
  return `sha256:${createHash('sha256').update(der).digest('hex')}`;
}

function pemToDer(pem: string): Buffer {
  const stripped = pem
    .replace(/-----BEGIN [^-]+-----/u, '')
    .replace(/-----END [^-]+-----/u, '')
    .replace(/\s+/gu, '');
  return Buffer.from(stripped, 'base64');
}

function normaliseFingerprint(input: string): string {
  return input.replace(/^sha256:/u, '').toLowerCase();
}

async function defaultFetcher(url: string, signal?: AbortSignal): Promise<string> {
  if (!url.startsWith('https://')) {
    throw new SkillSignatureInvalidError(
      'unknown',
      `Refusing to fetch publisher key over insecure transport (${url}).`,
    );
  }
  const response = await fetch(url, signal === undefined ? {} : { signal });
  if (!response.ok) {
    throw new SkillSignatureInvalidError(
      'unknown',
      `Public-key fetch returned HTTP ${response.status} for ${url}.`,
    );
  }
  return response.text();
}
