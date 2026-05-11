/**
 * Sandbox subsystem of `@graphorin/security`. Exposes the four
 * built-in adapters, the `SandboxImpl` interface, the tier resolver,
 * and the typed errors used by the dispatcher.
 *
 * @packageDocumentation
 */

export {
  createDockerSandbox,
  type DockerSandboxOptions,
} from './docker.js';
export {
  GraphorinSandboxError,
  MandatorySandboxOverrideError,
  SandboxFsAccessDeniedError,
  SandboxNetworkAccessDeniedError,
  SandboxPeerUnavailableError,
  UnsupportedSandboxKindError,
} from './errors.js';
export {
  createIsolatedVMSandbox,
  type IsolatedVMSandboxOptions,
} from './isolated-vm.js';
export {
  createNoneSandbox,
  type NoneSandboxHandler,
  type NoneSandboxOptions,
} from './none.js';
export {
  DEFAULT_MEMORY_LIMITS_MB,
  DEFAULT_TIMEOUTS_MS,
  type ResolvedSandboxPolicy,
  type SandboxCapabilities,
  type SandboxCode,
  type SandboxImpl,
  type SandboxKind,
  type SandboxResult,
  type SandboxRunOptions,
} from './sandbox.js';
export {
  type ResolveSandboxInput,
  resolveSandbox,
  type SandboxPolicyOverride,
  type SandboxTrustLevel,
} from './tier-resolver.js';
export {
  createWorkerThreadsSandbox,
  type WorkerPoolOptions,
  type WorkerThreadsSandboxOptions,
} from './worker-threads.js';
