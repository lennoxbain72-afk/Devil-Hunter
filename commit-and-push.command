#!/bin/bash
# Commit current changes and push to GitHub
set -e
cd "$(dirname "$0")"

echo "=== Committing build fixes ==="
git add -A
git status --short
echo

git commit -m "Fix build errors

- Remove unused ATTACK_RANGE const (TS6133)
- Add worker-configuration.d.ts stub with empty Env interface (TS2688)
- Strip Mocha-specific plugins from vite.config.ts for local dev
- Add .command helper scripts (push-to-github, retry-push, start-dev)"

git push origin main

echo
echo "=== DONE ==="
echo "Press any key to close."
read -n 1
