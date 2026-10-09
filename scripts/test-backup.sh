#!/usr/bin/env bash
# Requires a dev server started with PUBLIC_GOOGLE_DRIVE_CLIENT_ID=test-client-id.
set -euo pipefail

session="wq-backup-tests"
base="${BACKUP_TEST_BASE_URL:-http://127.0.0.1:4323/wisdom-quotes/}"
export BACKUP_TEST_BASE_URL="$base"
trap 'playwright-cli -s="$session" close >/dev/null 2>&1 || true' EXIT
playwright-cli -s="$session" open "$base" >/dev/null

for source in scripts/test-quote-restore.mjs scripts/e2e-google-drive.mjs; do
  result_file=$(mktemp)
  script_file=$(mktemp)
  # Test inputs are synthetic. Never run this on a personal browser session.
  sed "s|http://127.0.0.1:4323/wisdom-quotes/|$base|g" "$source" > "$script_file"
  if ! playwright-cli -s="$session" run-code --filename="$script_file" > "$result_file" 2>&1; then
    cat "$result_file"
    rm -f "$result_file" "$script_file"
    exit 1
  fi
  python3 - "$result_file" <<'PY'
import json, pathlib, re, sys
output = pathlib.Path(sys.argv[1]).read_text()
match = re.search(r"### Result\s*\n([^\n]+)", output)
if not match:
    raise SystemExit("Backup test returned no result")
result = json.loads(match.group(1))
if not result.get("ok"):
    raise SystemExit("Backup test failed")
for check in result["checks"]:
    print("PASS: " + check)
PY
  rm -f "$result_file" "$script_file"
done
