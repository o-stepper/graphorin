/**
 * Typed error classes for the skills supply-chain subsystem.
 *
 * @packageDocumentation
 */

/**
 * Base class for every supply-chain error. The framework follows
 * the project-wide convention of typed `kind` discriminators.
 *
 * @stable
 */
export class GraphorinSupplyChainError extends Error {
  readonly kind: string;
  readonly hint?: string;

  constructor(kind: string, message: string, options: { cause?: unknown; hint?: string } = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'GraphorinSupplyChainError';
    this.kind = kind;
    if (options.hint !== undefined) this.hint = options.hint;
  }
}

/**
 * Thrown when an `untrusted` install lacks a signature.
 *
 * @stable
 */
export class SkillSignatureMissingError extends GraphorinSupplyChainError {
  readonly skillId: string;
  constructor(skillId: string) {
    super(
      'signature-missing',
      `Skill '${skillId}' has no graphorin-signature block; refusing to install at trust level 'untrusted'.`,
      {
        hint: 'Either sign the SKILL.md or install with --trust trusted (only for skills you authored / audited).',
      },
    );
    this.name = 'SkillSignatureMissingError';
    this.skillId = skillId;
  }
}

/**
 * Thrown when the signature on the SKILL.md does not validate.
 *
 * @stable
 */
export class SkillSignatureInvalidError extends GraphorinSupplyChainError {
  readonly skillId: string;
  readonly publisher?: string;
  constructor(skillId: string, reason: string, publisher?: string) {
    super('signature-invalid', `Skill '${skillId}' signature is invalid: ${reason}`, {
      hint: 'Re-fetch the skill to rule out tampering; verify the publisher key has not been rotated.',
    });
    this.name = 'SkillSignatureInvalidError';
    this.skillId = skillId;
    if (publisher !== undefined) this.publisher = publisher;
  }
}

/**
 * Thrown when an install request is rejected by the operator-managed
 * deny list (or by the framework-maintained list once `'auto'` is
 * supported post-MVP).
 *
 * @stable
 */
export class SkillInstallDeniedError extends GraphorinSupplyChainError {
  readonly skillId: string;
  readonly source: 'denylist' | 'framework-denylist';
  constructor(skillId: string, source: 'denylist' | 'framework-denylist', pattern: string) {
    super(
      'install-denied',
      `Skill '${skillId}' is blocked by ${source} (matched pattern '${pattern}').`,
      { hint: 'Remove the denylist entry or rename the skill.' },
    );
    this.name = 'SkillInstallDeniedError';
    this.skillId = skillId;
    this.source = source;
  }
}

/**
 * Thrown when the underlying package manager returns a non-zero exit
 * code or otherwise fails to install the skill.
 *
 * @stable
 */
export class SkillInstallError extends GraphorinSupplyChainError {
  readonly skillId: string;
  readonly exitCode?: number;
  readonly stderr?: string;
  constructor(
    skillId: string,
    message: string,
    options: { exitCode?: number; stderr?: string; cause?: unknown } = {},
  ) {
    super('install-failed', message, options.cause === undefined ? {} : { cause: options.cause });
    this.name = 'SkillInstallError';
    this.skillId = skillId;
    if (options.exitCode !== undefined) this.exitCode = options.exitCode;
    if (options.stderr !== undefined) this.stderr = options.stderr;
  }
}

/**
 * Thrown when a SKILL.md cannot be parsed.
 *
 * @stable
 */
export class SkillManifestParseError extends GraphorinSupplyChainError {
  constructor(message: string, options: { cause?: unknown } = {}) {
    super('manifest-parse', message, options);
    this.name = 'SkillManifestParseError';
  }
}

/**
 * Thrown when an `untrusted` install requests `trusted-with-scripts`.
 *
 * @stable
 */
export class TrustLevelEscalationError extends GraphorinSupplyChainError {
  constructor(requested: string) {
    super(
      'trust-escalation',
      `Trust level '${requested}' is not allowed for npm/git skill installs (mandatory --ignore-scripts).`,
      { hint: 'Install the skill into a local folder if you need to run lifecycle scripts.' },
    );
    this.name = 'TrustLevelEscalationError';
  }
}
