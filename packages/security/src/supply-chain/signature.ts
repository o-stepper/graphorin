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
  /**
   * Operator trust root (D4 / security-01). When supplied, the RESOLVED
   * signing key must match the trust root or verification fails
   * `valid: false` with `reason: 'untrusted-key'` - a self-signed skill
   * whose inline key is not in the root can no longer verify green. The
   * root is checked AFTER the ed25519 signature itself is valid, so the
   * result distinguishes a bad signature from an untrusted signer.
   */
  readonly trustRoot?: SkillTrustRoot;
  /** Cancellation. */
  readonly signal?: AbortSignal;
  /** Optional pre-installed strategy registry override. */
  readonly publicKeyFetcher?: PublicKeyFetcher;
  readonly sigstoreVerifier?: SigstoreVerifier;
}

/**
 * Verify the ed25519 signature embedded in `skillMd`. Returns a
 * structured result instead of throwing for the validation outcome -
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
  // D4 / security-01: a valid signature from an UNTRUSTED key is not
  // authenticity. When an operator trust root is supplied, the resolved
  // key (fingerprint) and/or publisher must be in it; an inline
  // self-signed key that is not rooted verifies `valid: false`.
  if (options.trustRoot !== undefined) {
    const rootDecision = evaluateTrustRoot(options.trustRoot, {
      fingerprint,
      publisher: block.publisher,
      publicKeySource,
    });
    if (!rootDecision.trusted) {
      return Object.freeze({
        valid: false,
        publisher: block.publisher,
        publicKeySource,
        ...(fingerprint === undefined ? {} : { fingerprint }),
        ...(signerId === undefined ? {} : { signerId }),
        reason: rootDecision.reason,
      });
    }
  }
  return Object.freeze({
    valid: true,
    publisher: block.publisher,
    publicKeySource,
    ...(fingerprint === undefined ? {} : { fingerprint }),
    ...(signerId === undefined ? {} : { signerId }),
  });
}

/**
 * Operator trust root for skill signatures (D4 / security-01). At least
 * one leg must be non-empty to trust anything. `allowSigstore` (default
 * `true`) exempts sigstore-resolved keys (their identity/issuer were
 * already checked by the verifier).
 *
 * W-026: the `publishers` leg counts ONLY for keys resolved through the
 * `well-known` channel, whose URL host is verified to be the publisher's
 * domain (or a subdomain). The frontmatter `publisher` string is NOT
 * covered by the signature - anyone can claim any publisher - so an
 * inline key can never satisfy this leg (self-sign + claim
 * `publisher: trusted.example.com` used to pass). Inline keys require
 * the `fingerprints` leg.
 *
 * @stable
 */
export interface SkillTrustRoot {
  /** Trusted key fingerprints (`sha256:<hex>`; matching is fold-normalised). */
  readonly fingerprints?: ReadonlyArray<string>;
  /**
   * Trusted publisher DNS names. Satisfied only by `well-known`-resolved
   * keys whose URL host equals the publisher (or is its subdomain) -
   * control of the HTTPS endpoint on the publisher's domain is the one
   * channel that can vouch for the unsigned `publisher` string (W-026).
   */
  readonly publishers?: ReadonlyArray<string>;
  /** Trust sigstore-resolved keys without a fingerprint/publisher entry. Default `true`. */
  readonly allowSigstore?: boolean;
}

function evaluateTrustRoot(
  root: SkillTrustRoot,
  ctx: {
    readonly fingerprint: string | undefined;
    readonly publisher: string;
    readonly publicKeySource: SkillPublicKeyRef['kind'];
  },
): { readonly trusted: true } | { readonly trusted: false; readonly reason: string } {
  if (ctx.publicKeySource === 'sigstore' && root.allowSigstore !== false) {
    return { trusted: true };
  }
  const fpRoot = (root.fingerprints ?? []).map(normaliseFingerprint);
  const fpMatch =
    ctx.fingerprint !== undefined && fpRoot.includes(normaliseFingerprint(ctx.fingerprint));
  // W-026: the publisher string comes from ATTACKER-CONTROLLED
  // frontmatter and is excluded from the signed payload. Only the
  // well-known channel proves it (resolvePublicKey enforces
  // host==publisher there), so the publishers leg never accepts an
  // inline key.
  const pubMatch =
    ctx.publicKeySource === 'well-known' && (root.publishers ?? []).includes(ctx.publisher);
  if (fpMatch || pubMatch) return { trusted: true };
  return {
    trusted: false,
    reason: 'untrusted-key: signer is not in the operator trust root',
  };
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
      // W-102: the key URL comes from the same attacker-controlled
      // frontmatter as `publisher` - without this binding, a key hosted
      // ANYWHERE was accepted as "the publisher's". Web-PKI assumption:
      // only control of an HTTPS endpoint on the publisher's own domain
      // (or a subdomain, so keys.vendor.example.com works for
      // vendor.example.com) can vouch for the publisher string.
      let host: string;
      try {
        host = new URL(block.publicKeyRef.url).hostname.toLowerCase();
      } catch {
        throw new SkillSignatureInvalidError(
          block.publisher,
          `Malformed well-known key URL '${block.publicKeyRef.url}'.`,
          block.publisher,
        );
      }
      const publisher = block.publisher.toLowerCase();
      if (host !== publisher && !host.endsWith(`.${publisher}`)) {
        throw new SkillSignatureInvalidError(
          block.publisher,
          `Well-known key URL host '${host}' does not belong to publisher '${block.publisher}' ` +
            '(the key must be served from the publisher domain or a subdomain of it).',
          block.publisher,
        );
      }
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
  // W-102: an open redirect on the publisher's domain must not be able
  // to substitute the key source - the fetch never follows redirects.
  const response = await fetch(url, {
    redirect: 'error',
    ...(signal === undefined ? {} : { signal }),
  });
  if (!response.ok) {
    throw new SkillSignatureInvalidError(
      'unknown',
      `Public-key fetch returned HTTP ${response.status} for ${url}.`,
    );
  }
  return response.text();
}
