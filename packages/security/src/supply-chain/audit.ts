/**
 * In-memory registry of installed skills. Used by
 * {@link auditInstalledSkills} (`graphorin skills audit` library
 * function) to surface the trust-policy decisions and signature
 * verification results captured at install time.
 *
 * @packageDocumentation
 */

import type { SkillInstallationStatus } from './types.js';

const installations = new Map<string, SkillInstallationStatus>();

/**
 * Record an installation. Called automatically by the npm + git
 * installers; exposed for tests + custom installers.
 *
 * @stable
 */
export function recordInstallation(status: SkillInstallationStatus): void {
  installations.set(status.id, Object.freeze({ ...status }));
}

/**
 * Snapshot of every installation recorded in this process. Returns a
 * fresh frozen array so callers cannot mutate the registry.
 *
 * @stable
 */
export function auditInstalledSkills(): ReadonlyArray<SkillInstallationStatus> {
  return Object.freeze([...installations.values()]);
}

/**
 * Reset the installation registry. Used by tests.
 *
 * @experimental
 */
export function _resetSkillInstallationsForTesting(): void {
  installations.clear();
}
