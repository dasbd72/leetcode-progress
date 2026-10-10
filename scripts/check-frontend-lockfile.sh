#!/usr/bin/env bash
# Regenerate frontend/package-lock.json from frontend/package.json and fail if
# the committed lockfile was stale. Keeps npm's lockfile honest without
# relying on everyone remembering to run `npm install` after editing deps.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)/frontend"

npm install --package-lock-only >/dev/null

if ! git diff --quiet -- package-lock.json; then
  echo "error: frontend/package-lock.json was out of date with package.json." >&2
  echo "       Regenerated it — review, 'git add' the changes, and commit again." >&2
  exit 1
fi
