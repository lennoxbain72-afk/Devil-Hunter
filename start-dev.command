#!/bin/bash
# Starts the Devil Hunter local dev server.
# Leave this Terminal window open while you play — closing it stops the server.
set -e
cd "$(dirname "$0")/code"

echo "=== Devil Hunter dev server ==="
echo "Working dir: $(pwd)"
echo

# Make sure node + npm exist
if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found. Install Node.js from https://nodejs.org first."
  read -n 1
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "[1/2] Installing dependencies (first run only — takes ~1 min)..."
  npm install --no-audit --no-fund
else
  echo "[1/2] Dependencies already installed — skipping."
fi

echo
echo "[2/2] Starting Vite dev server..."
echo "Once it says 'ready', open http://localhost:5173 in your browser."
echo "Press Ctrl+C in this window to stop the server."
echo
npm run dev
