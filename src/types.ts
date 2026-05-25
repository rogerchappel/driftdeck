export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown';

export type ManifestSummary = {
  path: string;
  name?: string;
  version?: string;
  packageManager?: string;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  optionalDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  engines: Record<string, string>;
};

export type WorkflowSummary = {
  path: string;
  name: string;
};

export type RepoSnapshot = {
  name: string;
  path: string;
  relativePath: string;
  git: {
    defaultBranch: string | null;
    remotes: Record<string, string>;
  };
  packageManager: PackageManager;
  lockfiles: string[];
  manifests: ManifestSummary[];
  workflows: WorkflowSummary[];
  runtime: {
    node: string | null;
    python: string | null;
    volta: Record<string, string>;
  };
};

export type DeckSnapshot = {
  schemaVersion: 1;
  generatedAt: string;
  root: string;
  repos: RepoSnapshot[];
};

export type ScanOptions = {
  root: string;
  generatedAt?: string;
};

export type ChangeKind = 'added' | 'removed' | 'changed';

export type DriftChange = {
  repo: string;
  area: string;
  key: string;
  kind: ChangeKind;
  before?: unknown;
  after?: unknown;
};

export type DriftReport = {
  schemaVersion: 1;
  before: {
    root: string;
    generatedAt: string;
  };
  after: {
    root: string;
    generatedAt: string;
  };
  summary: {
    addedRepos: number;
    removedRepos: number;
    changedRepos: number;
    totalChanges: number;
  };
  changes: DriftChange[];
};
