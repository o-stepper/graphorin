/**
 * Structural driver types for the `better-sqlite3` family.
 *
 * These live in their own dependency-free module so that
 * `connection.ts` and `encryption/index.ts` can both reference them
 * without forming a circular import (`connection.ts` imports the cipher
 * helpers from `encryption/index.ts`, which in turn needs the driver
 * constructor type). `connection.ts` re-exports every type below, so
 * existing `@graphorin/store-sqlite` import paths are unchanged.
 *
 * @packageDocumentation
 */

/**
 * Subset of the `better-sqlite3` `Database` surface used by the store.
 * Declared structurally so the package can defer the peer dependency
 * load to runtime and keep the module load free of side effects.
 *
 * @internal
 */
export interface BetterSqlite3Database {
  pragma(query: string, options?: { simple?: boolean }): unknown;
  exec(query: string): void;
  prepare(query: string): BetterSqlite3Statement;
  /**
   * The returned wrapper also carries the `.deferred` / `.immediate` /
   * `.exclusive` variants (the store uses `.immediate` for every write
   * transaction).
   */
  transaction<T extends (...args: unknown[]) => unknown>(
    fn: T,
  ): T & { readonly deferred: T; readonly immediate: T; readonly exclusive: T };
  /**
   * Online page-level backup. Consistent under a live
   * writer and preserves rowids (so FTS5 external-content mappings
   * survive - unlike `VACUUM INTO`).
   */
  backup(destinationPath: string): Promise<unknown>;
  close(): void;
  loadExtension(path: string): void;
  readonly open: boolean;
  readonly inTransaction: boolean;
}

/**
 * Subset of the `better-sqlite3` prepared-statement surface used by
 * the store.
 *
 * @internal
 */
export interface BetterSqlite3Statement {
  run(...params: ReadonlyArray<unknown>): { changes: number; lastInsertRowid: number | bigint };
  get<T = unknown>(...params: ReadonlyArray<unknown>): T | undefined;
  all<T = unknown>(...params: ReadonlyArray<unknown>): T[];
  iterate<T = unknown>(...params: ReadonlyArray<unknown>): IterableIterator<T>;
  pluck(toggle?: boolean): this;
  raw(toggle?: boolean): this;
  expand(toggle?: boolean): this;
  bind(...params: ReadonlyArray<unknown>): this;
  finalize?(): void;
}

/**
 * Constructor signature exposed by both `better-sqlite3` and
 * `better-sqlite3-multiple-ciphers` (the cipher peer is a drop-in
 * replacement of the default driver).
 *
 * @internal
 */
export type BetterSqlite3Constructor = new (
  filename: string,
  options?: { readonly?: boolean; fileMustExist?: boolean; timeout?: number },
) => BetterSqlite3Database;
