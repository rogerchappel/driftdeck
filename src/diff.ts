import type { DeckSnapshot, DriftChange, DriftReport, RepoSnapshot } from './types.js';

export function diffSnapshots(before: DeckSnapshot, after: DeckSnapshot): DriftReport {
  const beforeRepos = byRelativePath(before.repos);
  const afterRepos = byRelativePath(after.repos);
  const changes: DriftChange[] = [];

  for (const [repo, snapshot] of beforeRepos) {
    if (!afterRepos.has(repo)) {
      changes.push({ repo, area: 'repo', key: repo, kind: 'removed', before: summarizeRepo(snapshot) });
    }
  }

  for (const [repo, snapshot] of afterRepos) {
    const previous = beforeRepos.get(repo);
    if (previous === undefined) {
      changes.push({ repo, area: 'repo', key: repo, kind: 'added', after: summarizeRepo(snapshot) });
      continue;
    }
    changes.push(...diffRepository(previous, snapshot));
  }

  const sortedChanges = changes.sort(compareChanges);
  const changedRepos = new Set(
    sortedChanges
      .filter((change) => change.area !== 'repo' || change.kind === 'changed')
      .map((change) => change.repo)
  ).size;

  return {
    schemaVersion: 1,
    before: {
      root: before.root,
      generatedAt: before.generatedAt
    },
    after: {
      root: after.root,
      generatedAt: after.generatedAt
    },
    summary: {
      addedRepos: sortedChanges.filter((change) => change.area === 'repo' && change.kind === 'added').length,
      removedRepos: sortedChanges.filter((change) => change.area === 'repo' && change.kind === 'removed').length,
      changedRepos,
      totalChanges: sortedChanges.length
    },
    changes: sortedChanges
  };
}

function diffRepository(before: RepoSnapshot, after: RepoSnapshot): DriftChange[] {
  const checks: Array<[string, string, unknown, unknown]> = [
    ['git', 'defaultBranch', before.git.defaultBranch, after.git.defaultBranch],
    ['git', 'remotes', before.git.remotes, after.git.remotes],
    ['packageManager', 'detected', before.packageManager, after.packageManager],
    ['lockfiles', 'files', before.lockfiles, after.lockfiles],
    ['manifests', 'package.json', before.manifests, after.manifests],
    ['workflows', 'github', before.workflows, after.workflows],
    ['runtime', 'versions', before.runtime, after.runtime]
  ];

  return checks
    .filter(([, , previous, next]) => !isEqual(previous, next))
    .map(([area, key, previous, next]) => ({
      repo: after.relativePath,
      area,
      key,
      kind: 'changed' as const,
      before: previous,
      after: next
    }));
}

function byRelativePath(repos: RepoSnapshot[]): Map<string, RepoSnapshot> {
  return new Map(repos.map((repo) => [repo.relativePath, repo]));
}

function summarizeRepo(repo: RepoSnapshot): Pick<RepoSnapshot, 'name' | 'relativePath' | 'packageManager'> {
  return {
    name: repo.name,
    relativePath: repo.relativePath,
    packageManager: repo.packageManager
  };
}

function isEqual(before: unknown, after: unknown): boolean {
  return JSON.stringify(before) === JSON.stringify(after);
}

function compareChanges(a: DriftChange, b: DriftChange): number {
  return (
    a.repo.localeCompare(b.repo) ||
    a.area.localeCompare(b.area) ||
    a.key.localeCompare(b.key) ||
    a.kind.localeCompare(b.kind)
  );
}
