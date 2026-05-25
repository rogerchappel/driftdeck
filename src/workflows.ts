import path from 'node:path';
import { listFilesRecursive, readTextIfExists } from './fs-utils.js';
import type { WorkflowSummary } from './types.js';

export async function readWorkflows(repoPath: string): Promise<WorkflowSummary[]> {
  const files = await listFilesRecursive(path.join(repoPath, '.github', 'workflows')).catch(() => []);
  const workflowFiles = files.filter((file) => /\.(ya?ml)$/i.test(file));
  const workflows = await Promise.all(workflowFiles.map((file) => readWorkflow(repoPath, file)));
  return workflows.sort((a, b) => a.path.localeCompare(b.path));
}

async function readWorkflow(repoPath: string, filePath: string): Promise<WorkflowSummary> {
  const content = await readTextIfExists(filePath);
  return {
    path: normalizeRelative(repoPath, filePath),
    name: extractWorkflowName(content) ?? path.basename(filePath).replace(/\.(ya?ml)$/i, '')
  };
}

function extractWorkflowName(content: string | null): string | null {
  if (content === null) {
    return null;
  }
  const match = content.match(/^name:\s*["']?(.+?)["']?\s*$/m);
  return match?.[1]?.trim() ?? null;
}

function normalizeRelative(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join('/');
}
