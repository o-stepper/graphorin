/**
 * @graphorin/core - types, contracts, and utilities for the Graphorin
 * framework. Dependency-free root package every other `@graphorin/*`
 * package depends on.
 *
 * The full documentation lives in the package `README.md` and the
 * sub-module barrels (`./types`, `./contracts`, `./utils`, `./channels`).
 *
 * @packageDocumentation
 */

import pkg from '../package.json' with { type: 'json' };

/**
 * Canonical version constant, derived from `package.json` at build
 * time so a release bump never has to edit source.
 */
export const VERSION: string = pkg.version;

export * from './channels/index.js';
export * from './contracts/index.js';
export * from './types/index.js';
export * from './utils/index.js';
