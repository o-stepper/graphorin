/**
 * Shared leaf for the skipped-native-build failure mode. Lives outside
 * `connection.ts` / `encryption/` so both driver loaders can use it
 * without re-creating the import cycle that `driver-types.ts` exists
 * to break.
 *
 * @packageDocumentation
 */

/**
 * Raised when a native SQLite peer is present in `node_modules` but its
 * compiled binding cannot be loaded. The dominant cause: pnpm 10+ skips
 * dependency build scripts unless they are approved, so
 * `better-sqlite3`'s prebuild download never ran - the install LOOKS
 * successful (pnpm prints one `Ignored build scripts` line) and the
 * process dies at first database open with a raw `bindings.js` stack.
 * This error replaces that stack with the actual fix.
 *
 * @stable
 */
export class SqliteNativeBindingError extends Error {
  override readonly name = 'SqliteNativeBindingError';
  /** Package-level error kind, matching the repo's `kind` convention. */
  readonly kind = 'sqlite-native-binding';
  /** The peer whose binding failed to load. */
  readonly packageName: string;

  constructor(packageName: string, cause: unknown) {
    super(
      `'${packageName}' is installed but its native binding is missing, so the install script that ` +
        'downloads the prebuilt binary never ran. pnpm 10+ skips dependency build scripts by default ' +
        `(it printed 'Ignored build scripts: ${packageName}...' during install). Fix: add ` +
        '`"pnpm": { "onlyBuiltDependencies": ["better-sqlite3", "sqlite-vec"] }` to your application ' +
        `package.json (or run 'pnpm approve-builds'), then reinstall or run 'pnpm rebuild ${packageName}'. ` +
        "npm and yarn consumers: run 'npm rebuild' / reinstall; see the installation guide's " +
        "'Native modules and pnpm 10' section.",
      { cause },
    );
    this.packageName = packageName;
  }
}

/**
 * Does an import failure look like a present-but-unbuilt native module
 * (the `bindings` locator gave up) rather than a missing package?
 * Walks a few `cause` links because ESM import errors may wrap the
 * original loader error.
 *
 * @internal
 */
export function isMissingNativeBindingError(err: unknown): boolean {
  let current: unknown = err;
  for (let depth = 0; depth < 4 && typeof current === 'object' && current !== null; depth += 1) {
    const message = (current as { message?: unknown }).message;
    if (typeof message === 'string' && message.includes('Could not locate the bindings file')) {
      return true;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}
