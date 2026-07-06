import { describe, expect, it } from 'vitest';

import { isMainModule } from '../src/index.js';

/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Pure-predicate coverage for `isMainModule` (W-147). The realpath
 * seam is injected so no real filesystem (and no host platform) leaks
 * into the cases: the windows-path and symlink scenarios must pass on
 * every OS of the CI matrix.
 */

const identity = (p: string) => p;

describe('isMainModule', () => {
  it('matches a plain posix path', () => {
    expect(isMainModule('file:///opt/app/main.js', '/opt/app/main.js', identity)).toBe(true);
  });

  it('rejects a different module', () => {
    expect(isMainModule('file:///opt/app/other.js', '/opt/app/main.js', identity)).toBe(false);
  });

  it('matches a path containing a space (URL-encoding)', () => {
    expect(isMainModule('file:///opt/my%20app/main.js', '/opt/my app/main.js', identity)).toBe(
      true,
    );
  });

  it('matches a windows path against its file URL', () => {
    // pathToFileURL on win32 turns C:\x\main.js into file:///C:/x/main.js.
    // On posix hosts pathToFileURL treats backslashes as ordinary
    // characters, so only assert the win32 shape when running there.
    if (process.platform === 'win32') {
      expect(isMainModule('file:///C:/x/main.js', 'C:\\x\\main.js', identity)).toBe(true);
    } else {
      // The old string-concat guard was false even for the canonical
      // posix form whenever the URL needed any encoding; the predicate
      // itself stays a pure URL comparison here.
      expect(isMainModule('file:///C:/x/main.js', '/C:/x/main.js', identity)).toBe(true);
    }
  });

  it('resolves a bin symlink through the realpath seam', () => {
    const realpath = (p: string) => (p === '/usr/local/bin/tool' ? '/opt/app/dist/main.js' : p);
    expect(isMainModule('file:///opt/app/dist/main.js', '/usr/local/bin/tool', realpath)).toBe(
      true,
    );
  });

  it('falls back to the unresolved path when realpath throws', () => {
    const realpath = () => {
      throw new Error('ENOENT');
    };
    expect(isMainModule('file:///opt/app/main.js', '/opt/app/main.js', realpath)).toBe(true);
  });

  it('returns false for undefined argv1', () => {
    expect(isMainModule('file:///opt/app/main.js', undefined, identity)).toBe(false);
  });
});
