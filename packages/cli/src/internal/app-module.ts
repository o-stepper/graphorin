/**
 * App-compose module loader for `graphorin start`. When the config
 * carries an `app` field, the launcher imports that module, calls its
 * factory with a `GraphorinAppContext`, and spreads the returned
 * adapter bag into `createServer(...)` - mounting the sessions /
 * memory / agents / workflows surface a bare infrastructure daemon
 * leaves 404. See `GraphorinAppFactory` in `@graphorin/server` for the
 * module contract.
 *
 * @packageDocumentation
 */

import { dirname, isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  type GraphorinAppBag,
  type GraphorinAppContext,
  type GraphorinAppFactory,
  parseServerConfig,
} from '@graphorin/server';

/**
 * Thrown when the configured app module cannot be imported, exports no
 * factory, or returns something that is not an adapter bag. The CLI
 * prints `message` and exits 1; the message always names the resolved
 * module path so the operator knows which file to fix.
 *
 * @stable
 */
export class AppModuleError extends Error {
  override readonly name = 'AppModuleError';
}

/** Result of {@link loadAppModule}: the bag to spread plus the close hook. */
export interface LoadedApp {
  readonly bag: Omit<GraphorinAppBag, 'close'>;
  readonly close?: () => void | Promise<void>;
}

/**
 * Import the app module at `appPath` (relative paths resolve against
 * the config file's directory), locate its factory (`default` export
 * first, `createApp` as the named fallback), invoke it with the
 * validated config context, and split the returned bag from its
 * optional `close` hook.
 *
 * @internal
 */
export async function loadAppModule(
  appPath: string,
  configPath: string,
  config: unknown,
): Promise<LoadedApp> {
  const configDir = dirname(configPath);
  const resolved = isAbsolute(appPath) ? appPath : resolve(configDir, appPath);
  let mod: Record<string, unknown>;
  try {
    mod = (await import(pathToFileURL(resolved).href)) as Record<string, unknown>;
  } catch (err) {
    throw new AppModuleError(
      `failed to import app module at ${resolved}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  const factory = (mod.default ?? mod.createApp) as GraphorinAppFactory | undefined;
  if (typeof factory !== 'function') {
    throw new AppModuleError(
      `app module at ${resolved} must default-export a factory function (or export it as createApp); ` +
        `got ${mod.default === undefined && mod.createApp === undefined ? 'no export' : typeof (mod.default ?? mod.createApp)}.`,
    );
  }
  const ctx: GraphorinAppContext = {
    config: parseServerConfig(config),
    configPath,
    configDir,
  };
  const returned = await factory(ctx);
  if (returned === null || typeof returned !== 'object' || Array.isArray(returned)) {
    throw new AppModuleError(
      `app factory at ${resolved} must return an adapter bag object, got ${
        returned === null ? 'null' : Array.isArray(returned) ? 'an array' : typeof returned
      }.`,
    );
  }
  const { close, ...bag } = returned as GraphorinAppBag & Record<string, unknown>;
  if (close !== undefined && typeof close !== 'function') {
    throw new AppModuleError(
      `app factory at ${resolved} returned a non-function \`close\` (${typeof close}).`,
    );
  }
  return { bag: bag as LoadedApp['bag'], ...(close !== undefined ? { close } : {}) };
}
