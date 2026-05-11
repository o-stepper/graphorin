/**
 * Parsed shape of a `SecretRef` URI (`scheme:[//authority]/path[?query][#fragment]`).
 *
 * The full grammar lives in `@graphorin/security`; the type lives here so
 * downstream packages can carry parsed refs without a security dependency.
 *
 * @stable
 */
export interface SecretRef {
  /** Original URI string as supplied by the caller. */
  readonly raw: string;
  /** Lowercased scheme (`'env'`, `'keyring'`, `'file'`, …). */
  readonly scheme: string;
  /** Optional authority component (e.g. `host[:port]`). */
  readonly authority?: string;
  /** Path component (without the leading slash for opaque schemes). */
  readonly path: string;
  /** Parsed query parameters (already percent-decoded). */
  readonly query: Readonly<Record<string, string>>;
  /** Optional fragment (e.g. JSON-Pointer for nested fields). */
  readonly fragment?: string;
}
