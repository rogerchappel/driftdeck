#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DriftDeckError } from './errors.js';
import { diffSnapshots } from './diff.js';
import { formatJson, formatMarkdown } from './format.js';
import { scanWorkspace } from './scanner.js';
import type { DeckSnapshot } from './types.js';

type ScanArgs = {
  root: string;
  out?: string;
};

type DiffArgs = {
  before: string;
  after: string;
  format: 'json' | 'markdown';
  out?: string;
};

async function main(argv: string[]): Promise<void> {
  const command = argv[0];

  if (command === 'scan') {
    const args = parseScanArgs(argv.slice(1));
    const snapshot = await scanWorkspace({ root: args.root });
    await writeOutput(formatJson(snapshot), args.out);
    return;
  }

  if (command === 'diff') {
    const args = parseDiffArgs(argv.slice(1));
    const before = await readSnapshot(args.before);
    const after = await readSnapshot(args.after);
    const report = diffSnapshots(before, after);
    const output = args.format === 'markdown' ? formatMarkdown(report) : formatJson(report);
    await writeOutput(output, args.out);
    return;
  }

  if (command === 'help' || command === '--help' || command === '-h' || command === undefined) {
    process.stdout.write(usage());
    return;
  }

  throw new DriftDeckError(`Unknown command: ${command}`);
}

function parseScanArgs(argv: string[]): ScanArgs {
  const positionals: string[] = [];
  let out: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out' || arg === '-o') {
      out = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    positionals.push(arg);
  }

  return {
    root: positionals[0] ?? process.cwd(),
    out
  };
}

function parseDiffArgs(argv: string[]): DiffArgs {
  const positionals: string[] = [];
  let format: 'json' | 'markdown' = 'json';
  let out: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--format' || arg === '-f') {
      const value = readValue(argv, index, arg);
      if (value !== 'json' && value !== 'markdown') {
        throw new DriftDeckError(`Unsupported diff format: ${value}`);
      }
      format = value;
      index += 1;
      continue;
    }
    if (arg === '--out' || arg === '-o') {
      out = readValue(argv, index, arg);
      index += 1;
      continue;
    }
    positionals.push(arg);
  }

  if (positionals.length < 2) {
    throw new DriftDeckError('diff requires <before.json> and <after.json>');
  }

  return {
    before: positionals[0],
    after: positionals[1],
    format,
    out
  };
}

function readValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith('-')) {
    throw new DriftDeckError(`${flag} requires a value`);
  }
  return value;
}

async function readSnapshot(filePath: string): Promise<DeckSnapshot> {
  return JSON.parse(await readFile(resolve(filePath), 'utf8')) as DeckSnapshot;
}

async function writeOutput(content: string, out?: string): Promise<void> {
  if (out === undefined) {
    process.stdout.write(content);
    return;
  }
  await writeFile(resolve(out), content);
}

function usage(): string {
  return `DriftDeck snapshots dependency and runtime drift across local Git repositories.

Usage:
  driftdeck scan [workspace] --out deck.json
  driftdeck diff before.json after.json --format json|markdown [--out report.md]

Commands:
  scan   Scan a workspace for Git repositories and emit a snapshot.
  diff   Compare two snapshots and emit a drift report.
`;
}

main(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`driftdeck: ${message}\n`);
  process.exitCode = 1;
});
