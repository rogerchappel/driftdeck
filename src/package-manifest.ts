import path from 'node:path';
import { listFilesRecursive, readJsonIfExists } from './fs-utils.js';
import type { ManifestSummary } from './types.js';

type PackageJson = {
  name?: string;
  version?: string;
  packageManager?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;
};

export const SELECTED_SCRIPT_NAMES = ['build', 'check', 'dev', 'lint', 'release:check', 'smoke', 'start', 'test'];

export async function readPackageManifests(repoPath: string): Promise<ManifestSummary[]> {
  const files = await listFilesRecursive(repoPath);
  const packageJsonFiles = files.filter((file) => path.basename(file) === 'package.json');
  const manifests = await Promise.all(packageJsonFiles.map((file) => readPackageManifest(repoPath, file)));
  return manifests.filter((manifest): manifest is ManifestSummary => manifest !== null);
}

async function readPackageManifest(repoPath: string, filePath: string): Promise<ManifestSummary | null> {
  const json = await readJsonIfExists<PackageJson>(filePath);
  if (json === null) {
    return null;
  }

  return {
    path: normalizeRelative(repoPath, filePath),
    name: json.name,
    version: json.version,
    packageManager: json.packageManager,
    scripts: pickScripts(json.scripts ?? {}),
    dependencies: sortRecord(json.dependencies ?? {}),
    devDependencies: sortRecord(json.devDependencies ?? {}),
    optionalDependencies: sortRecord(json.optionalDependencies ?? {}),
    peerDependencies: sortRecord(json.peerDependencies ?? {}),
    engines: sortRecord(json.engines ?? {})
  };
}

function pickScripts(scripts: Record<string, string>): Record<string, string> {
  const selected: Record<string, string> = {};
  for (const name of SELECTED_SCRIPT_NAMES) {
    if (scripts[name] !== undefined) {
      selected[name] = scripts[name];
    }
  }
  return selected;
}

function sortRecord(input: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)));
}

function normalizeRelative(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join('/');
}
