/**
 * Weak-secret heuristics. Pure, side-effect-free, and dependency-free
 * so the pepper / passphrase / token paths can fail fast on values that
 * pass a raw length check yet are obviously low quality (e.g. the
 * `"test-pepper-32-bytes-aaaaaaaaaaaa"` placeholder seen in examples
 * and CI smoke runs — 32 bytes, but a 12-byte run of identical
 * characters and low Shannon entropy).
 *
 * The thresholds are deliberately conservative: a `crypto.randomBytes`
 * value of the required length never trips them (32 random bytes have
 * ~4.5–5 observed bits/byte and a near-zero chance of an 8-byte
 * identical run), so legitimate secrets are unaffected.
 *
 * @packageDocumentation
 */

/** Tunable thresholds for {@link assessSecretStrength}. */
export interface SecretStrengthOptions {
  /** Minimum byte length. Default `32`. */
  readonly minBytes?: number;
  /** Minimum Shannon entropy in bits per byte. Default `3`. */
  readonly minShannonBitsPerByte?: number;
  /**
   * Reject when this many identical bytes appear consecutively.
   * Default `8`.
   */
  readonly maxIdenticalRun?: number;
}

/** Result of {@link assessSecretStrength}. */
export interface SecretStrength {
  /** Whether the secret cleared every threshold. */
  readonly ok: boolean;
  readonly byteLength: number;
  /** Estimated Shannon entropy of the byte distribution (bits/byte). */
  readonly shannonBitsPerByte: number;
  /** Longest run of identical consecutive bytes. */
  readonly maxIdenticalRun: number;
  /** Number of distinct byte values. */
  readonly distinctBytes: number;
  /** Human-readable reason when `ok` is `false`. */
  readonly reason?: string;
}

/**
 * Assess the strength of a raw secret buffer. Pure: callers decide
 * whether to throw or WARN on `ok === false`.
 *
 * @stable
 */
export function assessSecretStrength(
  bytes: Uint8Array,
  options: SecretStrengthOptions = {},
): SecretStrength {
  const minBytes = options.minBytes ?? 32;
  const minShannonBitsPerByte = options.minShannonBitsPerByte ?? 3;
  const maxIdenticalRun = options.maxIdenticalRun ?? 8;

  const byteLength = bytes.length;
  const counts = new Map<number, number>();
  let longestRun = byteLength === 0 ? 0 : 1;
  let currentRun = byteLength === 0 ? 0 : 1;
  for (let i = 0; i < byteLength; i += 1) {
    const b = bytes[i] as number;
    counts.set(b, (counts.get(b) ?? 0) + 1);
    if (i > 0 && b === bytes[i - 1]) {
      currentRun += 1;
      if (currentRun > longestRun) longestRun = currentRun;
    } else if (i > 0) {
      currentRun = 1;
    }
  }

  let shannon = 0;
  for (const count of counts.values()) {
    const p = count / byteLength;
    shannon -= p * Math.log2(p);
  }
  const shannonBitsPerByte = byteLength === 0 ? 0 : shannon;
  const distinctBytes = counts.size;

  let reason: string | undefined;
  if (byteLength < minBytes) {
    reason = `${byteLength} bytes is below the ${minBytes}-byte minimum`;
  } else if (longestRun >= maxIdenticalRun) {
    reason = `contains a run of ${longestRun} identical bytes (>= ${maxIdenticalRun}); looks like a placeholder/test value`;
  } else if (shannonBitsPerByte < minShannonBitsPerByte) {
    reason = `Shannon entropy ${shannonBitsPerByte.toFixed(2)} bits/byte is below the ${minShannonBitsPerByte} bits/byte floor`;
  }

  return {
    ok: reason === undefined,
    byteLength,
    shannonBitsPerByte,
    maxIdenticalRun: longestRun,
    distinctBytes,
    ...(reason === undefined ? {} : { reason }),
  };
}
