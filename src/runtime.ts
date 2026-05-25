import path from 'node:path';
import { readJsonIfExists, readTextIfExists } from './fs-utils.js';

type PackageJsonRuntime = {
  volta?: Record<string, string>;
};

export async function readRuntimeMetadata(repoPath: string): Promise<{
  node: string | null;
  python: string | null;
  volta: Record<string, string>;
}> {
  const node = await firstLine(path.join(repoPath, '.nvmrc')) ?? await firstLine(path.join(repoPath, '.node-version'));
  const python = await firstLine(path.join(repoPath, '.python-version'));
  const packageJson = await readJsonIfExists<PackageJsonRuntime>(path.join(repoPath, 'package.json'));

  return {
    node,
    python,
    volta: sortRecord(packageJson?.volta ?? {})
  };
}

async function firstLine(filePath: string): Promise<string | null> {
  const content = await readTextIfExists(filePath);
  if (content === null) {
    return null;
  }
  const line = content.split(/\r?\n/).find((entry) => entry.trim() !== '');
  return line?.trim() ?? null;
}

function sortRecord(input: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)));
}
