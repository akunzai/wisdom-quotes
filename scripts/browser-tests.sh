#!/usr/bin/env bash
# Run smoke + E2E in one Playwright browser session.
set -uo pipefail

BASE="${SMOKE_BASE_URL:-${E2E_BASE_URL:-http://localhost:4322/wisdom-quotes/}}"
export SMOKE_BASE_URL="$BASE"
export E2E_BASE_URL="$BASE"

echo "=== Wisdom Quotes Browser Tests ==="
echo "Base URL: $BASE"
echo ""

playwright-cli close >/dev/null 2>&1 || true
playwright-cli open "$BASE" >/dev/null 2>&1
sleep 1

TOTAL_START=$SECONDS

BROWSER_ALREADY_OPEN=1 SMOKE_BASE_URL="$BASE" ./scripts/smoke-test.sh
smoke_status=$?

BROWSER_ALREADY_OPEN=1 E2E_BASE_URL="$BASE" ./scripts/e2e-test.sh
e2e_status=$?

playwright-cli close >/dev/null 2>&1 || true

total_elapsed=$((SECONDS - TOTAL_START))
echo ""
echo "Total elapsed: ${total_elapsed}s"

if (( smoke_status != 0 || e2e_status != 0 )); then
  exit 1
fi
echo "All browser tests passed ✓"