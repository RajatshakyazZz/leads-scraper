#!/bin/bash
# Lead → Launch dashboard runner
# Double-click this file in Finder to start the dashboard.

set -e
cd "$(dirname "$0")/app"

echo ""
echo "════════════════════════════════════════"
echo "  Lead → Launch — starting dashboard"
echo "════════════════════════════════════════"
echo ""

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
  echo "First-time setup. Installing dependencies (takes 1–2 min)..."
  npm install
  echo ""
fi

# Open browser after a short delay (so server has time to come up)
(
  sleep 4
  open "http://localhost:3000"
) &

echo "Starting server..."
echo "Browser will open automatically in a few seconds."
echo ""
echo "To STOP: press Control + C in this window, or just close it."
echo ""

npm run dev
