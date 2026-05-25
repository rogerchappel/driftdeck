import { mkdtemp, cp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';
import assert from 'node:assert/strict';
import { diffSnapshots, formatMarkdown, scanWorkspace } from '../src/index.js';

const execFileAsync = promisify(execFile);

test('scanWorkspace captures deterministic repository metadata', async () => {
  const workspace = await fixtureWorkspace();

  const snapshot = await scanWorkspace({
    root: workspace,
    generatedAt: '2026-01-01T00:00:00.000Z'
  });

  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.repos.length, 2);
  assert.deepEqual(
    snapshot.repos.map((repo) => repo.relativePath),
    ['service-a', 'service-b']
  );

  const serviceA = snapshot.repos[0];
  assert.equal(serviceA.packageManager, 'npm');
  assert.deepEqual(serviceA.lockfiles, ['package-lock.json']);
  assert.deepEqual(serviceA.workflows, [{ path: '.github/workflows/ci.yml', name: 'CI' }]);
  assert.equal(serviceA.runtime.node, '20');
  assert.deepEqual(serviceA.manifests[0].scripts, {
    build: 'tsc',
    test: 'node --test'
  });
});

test('diffSnapshots reports changed repository metadata', async () => {
  const workspace = await fixtureWorkspace();
  const before = await scanWorkspace({ root: workspace, generatedAt: '2026-01-01T00:00:00.000Z' });

  await writeFile(
    path.join(workspace, 'service-a', 'package.json'),
    `${JSON.stringify(
      {
        name: 'service-a',
        version: '1.1.0',
        packageManager: 'npm@10.8.2',
        scripts: {
          build: 'tsc --build',
          test: 'node --test'
        },
        dependencies: {
          'left-pad': '1.3.0'
        }
      },
      null,
      2
    )}\n`
  );

  const after = await scanWorkspace({ root: workspace, generatedAt: '2026-01-02T00:00:00.000Z' });
  const report = diffSnapshots(before, after);

  assert.equal(report.summary.totalChanges, 1);
  assert.equal(report.changes[0].repo, 'service-a');
  assert.equal(report.changes[0].area, 'manifests');
  assert.match(formatMarkdown(report), /CHANGED service-a manifests\/package\.json/);
});

async function fixtureWorkspace(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'driftdeck-'));
  await cp(path.resolve('fixtures/workspace'), root, { recursive: true });
  await initRepo(path.join(root, 'service-a'));
  await initRepo(path.join(root, 'service-b'));
  return root;
}

async function initRepo(repoPath: string): Promise<void> {
  await execFileAsync('git', ['init', '--initial-branch=main'], { cwd: repoPath });
  await execFileAsync('git', ['config', 'user.email', 'driftdeck@example.com'], { cwd: repoPath });
  await execFileAsync('git', ['config', 'user.name', 'DriftDeck Test'], { cwd: repoPath });
  await execFileAsync('git', ['add', '.'], { cwd: repoPath });
  await execFileAsync('git', ['commit', '-m', 'fixture'], { cwd: repoPath });
}
