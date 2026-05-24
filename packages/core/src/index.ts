/**
 * @graphorin/core — types, contracts, and utilities for the Graphorin
 * framework. Dependency-free root package every other `@graphorin/*`
 * package depends on.
 *
 * The full documentation lives in the package `README.md` and the
 * sub-module barrels (`./types`, `./contracts`, `./utils`, `./channels`).
 *
 * @packageDocumentation
 */

/** Canonical version constant. Mirrors the `package.json` version. */
export const VERSION = '0.3.0';

export * from './channels/index.js';
export * from './contracts/index.js';
export * from './types/index.js';
export * from './utils/index.js';
