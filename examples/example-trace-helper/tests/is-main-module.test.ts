import { describe, expect, it } from 'vitest';

import { isMainModule } from '../src/index.js';

/**
 * Graphorin - MIT License - Copyright (c) 2026 Oleksiy Stepurenko
 *
 * Pure-predicate coverage for `isMainModule` (W-147). The realpath
 * seam is injected so no real filesystem leaks into the cases - but
 * `pathToFileURL` itself is host-platform-specific (on win32 it
 * drive-prefixes rootless posix paths: '/opt/x' becomes
 * 'file:///C:/opt/x'), so the FIXTURE PATHS are picked per platform
 * while every assertion tests the same property. The first CI run of
 * this file proved the point by failing 4/7 cases on windows-latest.
 */

const win = process.platform === 'win32';

/** Platform-appropriate absolute path + its expected file URL. */
const fx = (posixPath: string, winPath: string, winUrl: string, posixUrl: string) =>
  win ? { path: winPath, url: winUrl } : { path: posixPath, url: posixUrl };

const identity = (p: string) => p;

describe('isMainModule', () => {
  it('matches a plain absolute path', () => {
    const { path, url } = fx(
      '/opt/app/main.js',
      'C:\\opt\\app\\main.js',
      'file:///C:/opt/app/main.js',
      'file:///opt/app/main.js',
    );
    expect(isMainModule(url, path, identity)).toBe(true);
  });

  it('rejects a different module', () => {
    const { path } = fx(
      '/opt/app/main.js',
      'C:\\opt\\app\\main.js',
      'file:///C:/opt/app/main.js',
      'file:///opt/app/main.js',
    );
    const otherUrl = win ? 'file:///C:/opt/app/other.js' : 'file:///opt/app/other.js';
    expect(isMainModule(otherUrl, path, identity)).toBe(false);
  });

  it('matches a path containing a space (URL-encoding)', () => {
    const { path, url } = fx(
      '/opt/my app/main.js',
      'C:\\opt\\my app\\main.js',
      'file:///C:/opt/my%20app/main.js',
      'file:///opt/my%20app/main.js',
    );
    expect(isMainModule(url, path, identity)).toBe(true);
  });

  it('matches the host-native path shape against its file URL', () => {
    // On win32 this is the backslash case the old string-concat guard
    // silently failed on; on posix it pins the canonical form.
    const { path, url } = fx(
      '/x/main.js',
      'C:\\x\\main.js',
      'file:///C:/x/main.js',
      'file:///x/main.js',
    );
    expect(isMainModule(url, path, identity)).toBe(true);
  });

  it('resolves a bin symlink through the realpath seam', () => {
    const binPath = win ? 'C:\\bin\\tool' : '/usr/local/bin/tool';
    const real = fx(
      '/opt/app/dist/main.js',
      'C:\\opt\\app\\dist\\main.js',
      'file:///C:/opt/app/dist/main.js',
      'file:///opt/app/dist/main.js',
    );
    const realpath = (p: string) => (p === binPath ? real.path : p);
    expect(isMainModule(real.url, binPath, realpath)).toBe(true);
  });

  it('falls back to the unresolved path when realpath throws', () => {
    const { path, url } = fx(
      '/opt/app/main.js',
      'C:\\opt\\app\\main.js',
      'file:///C:/opt/app/main.js',
      'file:///opt/app/main.js',
    );
    const realpath = () => {
      throw new Error('ENOENT');
    };
    expect(isMainModule(url, path, realpath)).toBe(true);
  });

  it('returns false for undefined argv1', () => {
    expect(isMainModule('file:///opt/app/main.js', undefined, identity)).toBe(false);
  });
});
