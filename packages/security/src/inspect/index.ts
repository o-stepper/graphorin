/**
 * `@graphorin/security/inspect` - pluggable content-inspection seams
 * (D-12 injection classifier).
 *
 * @packageDocumentation
 */

export {
  type InjectionClassification,
  type InjectionClassifier,
  type InjectionClassifierGuardrailOptions,
  type InjectionClassifierInput,
  type InjectionClassifierSurface,
  injectionClassifierOutputGuardrail,
  runInjectionClassifier,
} from './injection-classifier.js';
