/**
 * Public types for the skills supply-chain subsystem.
 *
 * The framework distinguishes three trust levels:
 *
 * - `'trusted'` - folder-installed skills the operator authored or
 *   audited. The installer runs `--ignore-scripts` by default and
 *   only enables them with the explicit `'trusted-with-scripts'`
 *   override.
 * - `'trusted-with-scripts'` - folder-installed skills allowed to run
 *   their `postinstall` lifecycle. Mandates a verifiable signature.
 * - `'untrusted'` - skills installed from the npm registry or a git
 *   repository. The installer enforces `--ignore-scripts` with no
 *   override and rejects unsigned skills outright.
 *
 * @packageDocumentation
 */

/**
 * Discriminator for the trust level applied to an install request.
 *
 * @stable
 */
export type SkillTrustLevel = 'trusted' | 'trusted-with-scripts' | 'untrusted';

/**
 * Source descriptor for a skill installation request.
 *
 * @stable
 */
export type SkillSource =
  | { readonly kind: 'folder'; readonly path: string }
  | { readonly kind: 'npm-package'; readonly packageName: string; readonly version?: string }
  | { readonly kind: 'git-repo'; readonly url: string; readonly ref?: string };

/**
 * Parsed form of a `graphorin-signature:` block from a SKILL.md.
 *
 * @stable
 */
export interface SkillSignatureBlock {
  readonly algorithm: 'ed25519-sha256';
  readonly publisher: string;
  readonly publishedAt: string;
  readonly signature: string;
  readonly publicKeyRef: SkillPublicKeyRef;
}

/**
 * Discriminator for the public-key resolution strategy.
 *
 * @stable
 */
export type SkillPublicKeyRef =
  | {
      readonly kind: 'well-known';
      readonly url: string;
      readonly pinFingerprint?: string;
    }
  | {
      readonly kind: 'inline';
      readonly publicKeyPem: string;
    }
  | {
      readonly kind: 'sigstore';
      readonly identity: string;
      readonly issuer: string;
    };

/**
 * Result of a `verifySkillSignature` call.
 *
 * @stable
 */
export interface SkillSignatureVerificationResult {
  readonly valid: boolean;
  readonly signerId?: string;
  readonly publisher: string;
  readonly publicKeySource: SkillPublicKeyRef['kind'];
  readonly fingerprint?: string;
  readonly reason?: string;
}

/**
 * Result of {@link installSkillFromNpm} / {@link installSkillFromGit}.
 *
 * @stable
 */
export interface SkillInstallationStatus {
  readonly id: string;
  readonly source: SkillSource;
  readonly trustLevel: SkillTrustLevel;
  readonly ignoreScripts: boolean;
  readonly signatureVerified: boolean;
  readonly signature?: SkillSignatureVerificationResult;
  readonly installedAt: number;
  readonly version?: string;
  readonly installPath?: string;
  readonly publisher?: string;
}

/**
 * Trust policy applied to an install request. Auto-derived from
 * {@link SkillSource} and the optional operator override.
 *
 * @stable
 */
export interface ResolvedSkillTrustPolicy {
  readonly level: SkillTrustLevel;
  readonly ignoreScripts: boolean;
  readonly signature: { readonly required: boolean; readonly rejectIfMissing: boolean };
  readonly sandbox: 'inherit-frontmatter' | 'strict-default';
  readonly audit: 'always' | 'on-violation';
}

/**
 * Allow / deny / framework-denylist policy resolved from the operator
 * configuration.
 *
 * @stable
 */
export interface SupplyChainPolicy {
  readonly allowlist?: ReadonlyArray<string>;
  readonly denylist?: ReadonlyArray<string>;
  /**
   * `'auto'` is reserved for the post-MVP optional pull from a
   * framework-curated denylist. The MVP only supports the operator-
   * managed denylist; `'off'` is the only practical value.
   */
  readonly graphorinDenylist?: 'auto' | 'off';
  /**
   * Conflict resolution when a package matches BOTH the allowlist and a
   * deny list. `'allow-wins'` (the default) lets the allowlist short-circuit,
   * so an operator can deny a whole scope yet allow specific exceptions
   * inside it. `'deny-wins'` evaluates the deny lists first, so an explicit
   * denylist entry is never overridden by a broad allowlist glob - the safer
   * posture when the denylist is the security-critical list.
   *
   * Defaults to `'allow-wins'` (byte-identical to prior behaviour).
   */
  readonly precedence?: 'allow-wins' | 'deny-wins';
}

/**
 * Decision returned by {@link evaluateSupplyChainPolicy}.
 *
 * @stable
 */
export type SupplyChainDecision =
  | { readonly outcome: 'allow' }
  | {
      readonly outcome: 'deny';
      readonly reason: string;
      readonly source: 'denylist' | 'framework-denylist';
    };
