/**
 * Built-in resolver wiring. Importing from `@graphorin/security`
 * auto-installs every built-in scheme on first use; advanced consumers
 * can call `installBuiltinResolvers({ allowReplace: false })`
 * explicitly when sharing a process between multiple modules that all
 * register their own built-ins.
 *
 * @packageDocumentation
 */

import { encryptedFileResolver } from './encrypted-file.js';
import { envResolver } from './env.js';
import { fileResolver } from './file.js';
import { keyringResolver } from './keyring.js';
import { literalResolver } from './literal.js';
import { refResolver } from './ref.js';
import { _markBuiltinsInstalled, areBuiltinsInstalled, registerResolver } from './registry.js';
import { vaultResolver } from './vault.js';

/**
 * Idempotently install the seven built-in resolvers. Safe to call
 * multiple times - replays no-op if the registry already has them.
 *
 * @stable
 */
export function installBuiltinResolvers(opts: { allowReplace?: boolean } = {}): void {
  const allowReplace = opts.allowReplace ?? true;
  if (areBuiltinsInstalled() && !allowReplace) return;
  for (const resolver of [
    envResolver,
    keyringResolver,
    fileResolver,
    encryptedFileResolver,
    literalResolver,
    refResolver,
    vaultResolver,
  ]) {
    registerResolver(resolver, { allowReplace, source: 'builtin' });
  }
  _markBuiltinsInstalled();
}

export {
  _setArgon2idForTesting,
  type Argon2idFn,
  decryptBundle,
  deriveAesKey,
  ENCRYPTED_FILE_MAGIC,
} from './encrypted-file.js';
export { _resetFileResolverWarningsForTesting } from './file.js';

export {
  _setKeyringEntryCtorForTesting,
  KEYRING_DEFAULT_SERVICE,
  type KeyringEntryCtor,
} from './keyring.js';
export {
  _resetLiteralResolverForTesting,
  isLiteralAllowed,
  setLiteralAllowed,
} from './literal.js';
export { type RefStoreLookup, setRefStoreLookup } from './ref.js';
export {
  _resetResolversForTesting,
  areBuiltinsInstalled,
  getResolver,
  listResolverSchemes,
  type RegisterResolverOptions,
  registerResolver,
  resolveSecret,
  unregisterResolver,
} from './registry.js';
export { setVaultAdapter, type VaultAdapter } from './vault.js';
export {
  encryptedFileResolver,
  envResolver,
  fileResolver,
  keyringResolver,
  literalResolver,
  refResolver,
  vaultResolver,
};

// Eagerly install on first import. Tests that need a clean registry
// can call `_resetResolversForTesting()` followed by
// `installBuiltinResolvers()` from their setup hook.
installBuiltinResolvers();
