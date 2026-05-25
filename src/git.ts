import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function getGitRemotes(repoPath: string): Promise<Record<string, string>> {
  const output = await git(repoPath, ['remote', '-v']);
  const remotes: Record<string, string> = {};

  for (const line of output.split('\n')) {
    const match = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)$/);
    if (!match || match[3] !== 'fetch') {
      continue;
    }
    remotes[match[1]] = match[2];
  }

  return sortRecord(remotes);
}

export async function getDefaultBranch(repoPath: string): Promise<string | null> {
  const symbolic = await git(repoPath, ['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD']);
  if (symbolic.trim().startsWith('origin/')) {
    return symbolic.trim().slice('origin/'.length);
  }

  const local = await git(repoPath, ['branch', '--show-current']);
  return local.trim() || null;
}

async function git(cwd: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', args, { cwd });
    return stdout;
  } catch {
    return '';
  }
}

function sortRecord(input: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(input).sort(([a], [b]) => a.localeCompare(b)));
}
