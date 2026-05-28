#!/bin/bash
# Run after crach-ad accepts the collaborator invite
set -e
cd "$(dirname "$0")"

echo "=== Retrying push to GitHub ==="
git push -u origin main

echo
echo "=== DONE ==="
echo "Press any key to close."
read -n 1
