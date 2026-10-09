#!/usr/bin/env bash
# Regenerate the Lambda layer requirements.txt files from uv.lock and fail if
# the committed files were stale. Keeps the bundled layer dependencies in sync
# with the workspace lock without requiring uv in the deploy environment.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

uv export --package backend --no-dev --no-emit-workspace --no-hashes --frozen -o backend/layer/requirements.txt >/dev/null
uv export --package scraper --no-dev --no-emit-workspace --no-hashes --frozen -o scraper/layer/requirements.txt >/dev/null

if ! git diff --quiet -- backend/layer/requirements.txt scraper/layer/requirements.txt; then
  echo "error: Lambda layer requirements.txt was out of date with uv.lock." >&2
  echo "       Regenerated them — review, 'git add' the changes, and commit again." >&2
  exit 1
fi
