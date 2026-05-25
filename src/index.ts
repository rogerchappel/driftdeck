export type {
  ChangeKind,
  DeckSnapshot,
  DriftChange,
  DriftReport,
  ManifestSummary,
  PackageManager,
  RepoSnapshot,
  ScanOptions,
  WorkflowSummary
} from './types.js';

export { DriftDeckError } from './errors.js';
export { diffSnapshots } from './diff.js';
export { formatJson, formatMarkdown } from './format.js';
export { scanWorkspace } from './scanner.js';
