import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readTextIfExists(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

export async function readJsonIfExists<T>(filePath: string): Promise<T | null> {
  const content = await readTextIfExists(filePath);
  if (content === null) {
    return null;
  }
  return JSON.parse(content) as T;
}

export async function listFilesRecursive(root: string): Promise<string[]> {
  const result: string[] = [];
  await walk(root, result);
  return result.sort((a, b) => a.localeCompare(b));
}

async function walk(current: string, result: string[]): Promise<void> {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue;
    }

    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, result);
      continue;
    }

    if (entry.isFile()) {
      result.push(fullPath);
    }
  }
}
