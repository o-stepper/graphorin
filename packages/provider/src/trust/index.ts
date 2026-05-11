/**
 * Trust subsystem barrel — exports the shared classifier and the
 * per-tier sensitivity defaults.
 *
 * @packageDocumentation
 */

export type { LocalProviderTrust, OllamaTrust } from '@graphorin/core';
export {
  classifyLocalProvider,
  type LocalProviderClassification,
  PERMANENT_LOOPBACK_CLASSIFICATION,
  SENSITIVITY_DEFAULTS_PER_TRUST,
} from './classify-local-provider.js';
