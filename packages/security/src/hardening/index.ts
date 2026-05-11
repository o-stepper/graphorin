/**
 * Hardening subsystem of `@graphorin/security`. Exposes the
 * startup helpers, the POSIX file-mode utilities, the doctor
 * library functions, and the bootstrap-token helpers.
 *
 * @packageDocumentation
 */

export {
  _resetHardeningStatusForTesting,
  type ApplyProcessHardeningOptions,
  applyProcessHardening,
  getHardeningStatus,
  type HardeningStatus,
} from './apply.js';
export {
  BOOTSTRAP_TOKEN_LENGTH,
  encodeBase62,
  generateAesSalt,
  generateBootstrapToken,
} from './crypto.js';
export {
  type CheckPermsOptions,
  type CheckResult,
  type CheckStatus,
  checkEncryption,
  checkPerms,
  checkSecrets,
  checkSystemd,
  parseSystemdScore,
} from './doctor.js';
export {
  FileModeMismatchError,
  GraphorinHardeningError,
  RefuseToRunAsRootError,
} from './errors.js';
export { ensureDirMode, ensureFileMode, verifyFileMode } from './file-modes.js';
