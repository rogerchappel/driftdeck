import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { getDefaultBranch, getGitRemotes } from './git.js';
import { findLockfiles, detectPackageManager } from './lockfiles.js';
import { readPackageManifests } from './package-manifest.js';
import { readRuntimeMetadata } from './runtime.js';
import type { DeckSnapshot, RepoSnapshot, ScanOptions } from './types.js';
import { readWorkflows } from './workflows.js';

const SKIPPED_DIRECTORIES = new Set(['.git', 'node_modules', 'dist', 'coverage']);

export async function scanWorkspace(options: ScanOptions): Promise<DeckSnapshot> {
  const root = path.resolve(options.root);
  const repoPaths = await findGitRepositories(root);
  const repos = await Promise.all(repoPaths.map((repoPath) => scanRepository(root, repoPath)));

  return {
    schemaVersion: 1,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    root,
    repos: repos.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  };
}

async function findGitRepositories(root: string): Promise<string[]> {
  const repos: string[] = [];
  await walk(root, repos);
  return repos.sort((a, b) => a.localeCompare(b));
}

async function walk(current: string, repos: string[]): Promise<void> {
  const entries = await readdir(current, { withFileTypes: true });
  if (entries.some((entry) => entry.isDirectory() && entry.name === '.git')) {
    repos.push(current);
    return;
  }

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || SKIPPED_DIRECTORIES.has(entry.name)) {
      continue;
    }
    await walk(path.join(current, entry.name), repos);
  }
}

async function scanRepository(root: string, repoPath: string): Promise<RepoSnapshot> {
  const [defaultBranch, remotes, lockfiles, manifests, workflows, runtime] = await Promise.all([
    getDefaultBranch(repoPath),
    getGitRemotes(repoPath),
    findLockfiles(repoPath),
    readPackageManifests(repoPath),
    readWorkflows(repoPath),
    readRuntimeMetadata(repoPath)
  ]);
  const primaryManifest = manifests.find((manifest) => manifest.path === 'package.json') ?? manifests[0];
  const relativePath = normalizeRelative(root, repoPath);

  return {
    name: path.basename(repoPath),
    path: repoPath,
    relativePath,
    git: {
      defaultBranch,
      remotes
    },
    packageManager: detectPackageManager(lockfiles, primaryManifest?.packageManager),
    lockfiles,
    manifests,
    workflows,
    runtime
  };
}

function normalizeRelative(root: string, target: string): string {
  const relative = path.relative(root, target).split(path.sep).join('/');
  return relative === '' ? '.' : relative;
}
