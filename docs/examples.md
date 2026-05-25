# Examples

## Snapshot a workspace

```sh
driftdeck scan ~/Developer/my-opensource --out deck.json
```

## Review drift as Markdown

```sh
driftdeck diff baseline.json deck.json --format markdown --out report.md
```

## Review drift as JSON

```sh
driftdeck diff baseline.json deck.json --format json
```

The JSON format is intended for agents and scripts. The Markdown format is intended for pull requests and maintenance notes.
