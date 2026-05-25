# DriftDeck PRD

Status: in-progress

## Summary

DriftDeck is a local-first CLI that snapshots dependency, script, CI, and runtime metadata across a folder of repositories, then reports what drifted since the last known-good deck. It is built for maintainers and agents who need a quick, deterministic way to see which repos quietly changed shape.

## Problem

Multi-repo workspaces rot in small ways: package managers change, scripts disappear, CI files diverge, Node/Python versions drift, and agents waste time rediscovering the same context. Existing tools focus on one ecosystem or require hosted inventory. DriftDeck keeps the inventory local and reviewable.

## V1 Scope

- Scan a workspace for Git repositories.
- Collect package manifests, lockfiles, tool versions, CI workflow names, git remotes, default branch, and selected script commands.
- Write deterministic JSON snapshots.
- Compare two snapshots and emit JSON or Markdown drift reports.
- Provide fixture-backed tests and CLI smoke scripts.

## Non-Goals

- Hosted dashboards.
- Network dependency graph resolution.
- Automatic dependency updates.

## CLI

```bash
driftdeck scan ./fixtures/workspace --out deck.json
driftdeck diff before.json after.json --format markdown
```

## Source Attribution

Inspired by common monorepo audit scripts and ecosystem tools such as Renovate and npm-check-updates, reframed as a small local inventory and drift report tool rather than an update bot.
