# DriftDeck

DriftDeck is a local-first CLI for snapshotting dependency, script, CI, Git, and runtime metadata across a folder of repositories. It gives maintainers and agents a deterministic deck they can diff when a workspace quietly changes shape.

## Status

This repository is early-stage. The MVP supports local scans and local snapshot diffs; hosted dashboards and dependency update automation are intentionally out of scope.

## Install

Use from a checkout:

```sh
npm install
npm run build
npx driftdeck --help
```

## Use

Scan a workspace:

```sh
npx driftdeck scan ~/Developer --out deck.json
```

Compare two snapshots:

```sh
npx driftdeck diff before.json after.json --format markdown --out drift-report.md
```

## Verify

Run the local validation script before opening a pull request:

```sh
bash scripts/validate.sh
```

Useful focused checks:

```sh
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations. Changes
should be small, reviewable, and verified before review.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## License

MIT
