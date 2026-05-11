/**
 * Typed errors raised by the process-hardening subsystem.
 *
 * @packageDocumentation
 */

import { GraphorinSecretsError } from '../secrets/errors.js';

/**
 * Generic base for hardening-specific errors. Carries `kind` for
 * structured error handling and inherits `hint` from the package
 * base.
 *
 * @stable
 */
export abstract class GraphorinHardeningError extends GraphorinSecretsError {}

/**
 * Raised by `applyProcessHardening(...)` when the active POSIX user
 * is `root` and the operator did not pass `allowRoot: true`.
 *
 * @stable
 */
export class RefuseToRunAsRootError extends GraphorinHardeningError {
  override readonly kind: 'refuse-to-run-as-root' = 'refuse-to-run-as-root';
  constructor() {
    super(
      'refuse-to-run-as-root',
      '@graphorin/security refuses to run as root; use a dedicated non-root user (systemd User= directive, Docker USER instruction, or k8s securityContext.runAsUser).',
      {
        hint: 'Pass { allowRoot: true } to applyProcessHardening({...}) only after reviewing DEC-135. The framework deliberately exits with a non-zero status when running as root because secrets and audit-log files inherit the EUID of the writer.',
      },
    );
  }
}

/**
 * Raised by `ensureFileMode(...)` when the post-condition check
 * fails (the underlying filesystem refuses the requested mode).
 *
 * @stable
 */
export class FileModeMismatchError extends GraphorinHardeningError {
  override readonly kind: 'file-mode-mismatch' = 'file-mode-mismatch';
  readonly path: string;
  readonly expected: number;
  readonly actual: number;
  constructor(path: string, expected: number, actual: number) {
    super(
      'file-mode-mismatch',
      `file mode mismatch on ${path}: expected ${expected.toString(8)} got ${actual.toString(8)}`,
      {
        hint: 'Check that the host filesystem honours POSIX modes (Windows / FAT do not). Run `graphorin doctor --fix-perms` to repair.',
      },
    );
    this.path = path;
    this.expected = expected;
    this.actual = actual;
  }
}
