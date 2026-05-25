#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
workspace="$(mktemp -d "${TMPDIR:-/tmp}/driftdeck-smoke.XXXXXX")"

cleanup() {
  rm -rf "$workspace"
}
trap cleanup EXIT

cp -R "$repo_root/fixtures/workspace/." "$workspace/"

for repo in "$workspace"/service-a "$workspace"/service-b; do
  git -C "$repo" init --initial-branch=main >/dev/null
  git -C "$repo" config user.email driftdeck@example.com
  git -C "$repo" config user.name "DriftDeck Smoke"
  git -C "$repo" add .
  git -C "$repo" commit -m fixture >/dev/null
done

node "$repo_root/dist/src/cli.js" scan "$workspace" --out "$workspace/before.json"

node -e "const fs=require('node:fs'); const p=process.argv[1]; const j=JSON.parse(fs.readFileSync(p,'utf8')); j.scripts.build='tsc --build'; fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n')" "$workspace/service-a/package.json"

node "$repo_root/dist/src/cli.js" scan "$workspace" --out "$workspace/after.json"
node "$repo_root/dist/src/cli.js" diff "$workspace/before.json" "$workspace/after.json" --format markdown --out "$workspace/report.md"

grep -q "CHANGED service-a manifests/package.json" "$workspace/report.md"
