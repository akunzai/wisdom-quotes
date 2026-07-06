#!/usr/bin/env bash
# E2E tests for Wisdom Quotes — requires preview/dev server and playwright-cli.
set -uo pipefail

BASE="${E2E_BASE_URL:-http://localhost:4322/wisdom-quotes/}"
PASS=0
FAIL=0
RESULTS=()

pass() { PASS=$((PASS + 1)); RESULTS+=("✓ $1"); }
fail() { FAIL=$((FAIL + 1)); RESULTS+=("✗ $1 — $2"); }

run_code_file() {
  local src="$1" tmp
  tmp=$(mktemp)
  sed "s|__E2E_BASE__|${BASE}|g" "$src" > "$tmp"
  playwright-cli run-code --filename="$tmp" 2>&1 | python3 -c '
import json, re, sys
text = sys.stdin.read()
match = re.search(r"### Result\s*\n(.+)", text)
if not match:
    sys.exit(1)
raw = match.group(1).strip()
data = json.loads(raw)
if isinstance(data, str):
    data = json.loads(data)
print(json.dumps(data))
'
  rm -f "$tmp"
}

parse_json_result() {
  python3 -c '
import ast, json, sys
raw = sys.stdin.read().strip()
if not raw:
    sys.exit(1)
try:
    data = json.loads(raw)
except json.JSONDecodeError:
    data = ast.literal_eval(raw)
if isinstance(data, str):
    data = json.loads(data)
for key in sys.argv[1:]:
    val = data
    for part in key.split("."):
        val = val.get(part) if isinstance(val, dict) else None
    print("" if val is None else val)
' "$@"
}

echo "=== Wisdom Quotes E2E Test ==="
echo "Base URL: $BASE"
echo ""

playwright-cli close >/dev/null 2>&1 || true
playwright-cli open "$BASE" >/dev/null 2>&1
sleep 2

client_nav_result=$(run_code_file scripts/e2e-client-navigation.mjs)
client_nav_ok=$(printf '%s' "$client_nav_result" | parse_json_result ok 2>/dev/null | tr '[:upper:]' '[:lower:]')

if [[ "$client_nav_ok" == "true" ]]; then
  pass "Client-side navigation (no full page reload)"
else
  fail "Client-side navigation (no full page reload)" "$(printf '%s' "$client_nav_result" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(json.dumps(d.get("checks", d), ensure_ascii=False))' 2>/dev/null || echo "$client_nav_result")"
fi

header_persist=$(printf '%s' "$client_nav_result" | parse_json_result checks.headerPersisted 2>/dev/null | tr '[:upper:]' '[:lower:]')
if [[ "$header_persist" == "true" ]]; then
  pass "Persisted header survives tab clicks"
else
  fail "Persisted header survives tab clicks" "$(printf '%s' "$client_nav_result" | parse_json_result checks 2>/dev/null || true)"
fi

nav_result=$(run_code_file scripts/e2e-nav-tabs.mjs)
nav_ok=$(printf '%s' "$nav_result" | parse_json_result ok 2>/dev/null | tr '[:upper:]' '[:lower:]')

if [[ "$nav_ok" == "true" ]]; then
  pass "Nav tab active state after client-side clicks"
else
  fail "Nav tab active state after client-side clicks" "$(printf '%s' "$nav_result" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(json.dumps(d.get("steps", d), ensure_ascii=False))' 2>/dev/null || echo "$nav_result")"
fi

# Title checks from nav flow
title_authors=$(printf '%s' "$nav_result" | python3 -c '
import json, sys
data = json.load(sys.stdin)
for step in data.get("steps", []):
    if step.get("step") == "click-authors":
        print(step.get("title", ""))
        break
' 2>/dev/null || true)
if [[ "$title_authors" == *"作者"* ]] || [[ "$title_authors" == *"Authors"* ]]; then
  pass "Authors page title after tab click ($title_authors)"
else
  fail "Authors page title after tab click" "got '$title_authors'"
fi

title_settings=$(printf '%s' "$nav_result" | python3 -c '
import json, sys
data = json.load(sys.stdin)
for step in data.get("steps", []):
    if step.get("step") == "click-settings":
        print(step.get("title", ""))
        break
' 2>/dev/null || true)
if [[ "$title_settings" == *"設定"* ]] || [[ "$title_settings" == *"Settings"* ]]; then
  pass "Settings page title after tab click ($title_settings)"
else
  fail "Settings page title after tab click" "got '$title_settings'"
fi

playwright-cli close >/dev/null 2>&1

echo ""
for r in "${RESULTS[@]}"; do echo "$r"; done
echo ""
echo "Passed: $PASS / $((PASS + FAIL))"
if (( FAIL > 0 )); then echo "Failed: $FAIL"; exit 1; fi
echo "All E2E tests passed ✓"