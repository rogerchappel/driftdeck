import path from 'node:path';
import { listFilesRecursive } from './fs-utils.js';
import type { PackageManager } from './types.js';

const LOCKFILE_MANAGERS: Record<string, PackageManager> = {
  'package-lock.json': 'npm',
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'bun.lockb': 'bun',
  'bun.lock': 'bun'
};

export async function findLockfiles(repoPath: string): Promise<string[]> {
  const files = await listFilesRecursive(repoPath);
  return files
    .filter((file) => LOCKFILE_MANAGERS[path.basename(file)] !== undefined)
    .map((file) => normalizeRelative(repoPath, file))
    .sort((a, b) => a.localeCompare(b));
}

export function detectPackageManager(lockfiles: string[], manifestPackageManager?: string): PackageManager {
  if (manifestPackageManager?.startsWith('pnpm@')) {
    return 'pnpm';
  }
  if (manifestPackageManager?.startsWith('npm@')) {
    return 'npm';
  }
  if (manifestPackageManager?.startsWith('yarn@')) {
    return 'yarn';
  }
  if (manifestPackageManager?.startsWith('bun@')) {
    return 'bun';
  }

  for (const lockfile of lockfiles) {
    const manager = LOCKFILE_MANAGERS[path.basename(lockfile)];
    if (manager !== undefined) {
      return manager;
    }
  }

  return 'unknown';
}

function normalizeRelative(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join('/');
}
