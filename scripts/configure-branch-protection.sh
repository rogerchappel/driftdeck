#!/usr/bin/env bash
set -euo pipefail

repo="${1:-}"
branch="${2:-main}"

if [ -z "$repo" ]; then
  printf 'Usage: %s owner/repo [branch]\n' "$0" >&2
  exit 2
fi

if ! command -v gh >/dev/null 2>&1; then
  printf 'gh is required to configure branch protection.\n' >&2
  exit 1
fi

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/$repo/branches/$branch/protection" \
  -f required_status_checks.strict=true \
  -f enforce_admins=true \
  -f required_pull_request_reviews.required_approving_review_count=1 \
  -f restrictions=
