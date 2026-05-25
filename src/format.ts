import type { DriftChange, DriftReport } from './types.js';

export function formatJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function formatMarkdown(report: DriftReport): string {
  const lines = [
    '# DriftDeck Report',
    '',
    `Before: ${report.before.generatedAt}`,
    `After: ${report.after.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Added repos: ${report.summary.addedRepos}`,
    `- Removed repos: ${report.summary.removedRepos}`,
    `- Changed repos: ${report.summary.changedRepos}`,
    `- Total changes: ${report.summary.totalChanges}`,
    '',
    '## Changes',
    ''
  ];

  if (report.changes.length === 0) {
    lines.push('- No drift detected.');
  } else {
    for (const change of report.changes) {
      lines.push(formatChange(change));
    }
  }

  return `${lines.join('\n')}\n`;
}

function formatChange(change: DriftChange): string {
  const prefix = `- ${change.kind.toUpperCase()} ${change.repo} ${change.area}/${change.key}`;
  if (change.kind !== 'changed') {
    return prefix;
  }
  return `${prefix}: ${inlineJson(change.before)} -> ${inlineJson(change.after)}`;
}

function inlineJson(value: unknown): string {
  return JSON.stringify(value);
}
