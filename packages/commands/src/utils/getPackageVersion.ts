import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Find the nearest "package.json" by walking up from `fromDir` and return its "version".
 *
 * Each executable needs to know its own version, but it cannot read it with a
 * self-referential import (e.g. `require('@awesome-database-backup/xxx/package.json')`)
 * because pnpm does not create a symlink for a package to itself, so the import is
 * unresolvable both at lint time and at runtime.
 *
 * Passing `__dirname` works regardless of where the compiled output lives
 * (e.g. "dist/"), in development (ts-node-dev) and once published.
 */
export function getPackageVersion(fromDir: string): string {
  const packageJsonPath = join(fromDir, 'package.json');
  if (existsSync(packageJsonPath)) {
    return JSON.parse(readFileSync(packageJsonPath, 'utf8')).version;
  }

  const parent = dirname(fromDir);
  if (parent === fromDir) {
    throw new Error(`Could not find package.json above "${fromDir}"`);
  }
  return getPackageVersion(parent);
}
