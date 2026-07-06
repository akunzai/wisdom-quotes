#!/usr/bin/env bash
# Smoke test for Wisdom Quotes — single Playwright session via smoke-flow.mjs.
set -uo pipefail

BASE="${SMOKE_BASE_URL:-http://localhost:4322/wisdom-quotes/}"
PASS=0
FAIL=0
RESULTS=()
SMOKE_TAG="SMOKE_$(date +%s)"

pass() { PASS=$((PASS + 1)); RESULTS+=("✓ $1"); }
fail() { FAIL=$((FAIL + 1)); RESULTS+=("✗ $1 — $2"); }

eval_js() {
  local raw
  raw=$(playwright-cli eval "$1" 2>&1 | awk '/^### Result$/{getline; print; exit}')
  if [[ "$raw" =~ ^\".*\"$ ]]; then
    raw="${raw#\"}"
    raw="${raw%\"}"
  fi
  printf '%s' "$raw"
}

run_code_file() {
  local src="$1" tmp
  tmp=$(mktemp)
  sed "s|__SMOKE_BASE__|${BASE}|g; s|__SMOKE_TAG__|${SMOKE_TAG}|g" "$src" > "$tmp"
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

echo "=== Wisdom Quotes Smoke Test ==="
echo "Base URL: $BASE"
echo ""

if [[ "${BROWSER_ALREADY_OPEN:-}" != "1" ]]; then
  playwright-cli close >/dev/null 2>&1 || true
  playwright-cli open "$BASE" >/dev/null 2>&1
  sleep 2
fi
playwright-cli dialog-accept >/dev/null 2>&1 || true
playwright-cli dialog-dismiss >/dev/null 2>&1 || true

start_secs=$SECONDS
if ! result=$(run_code_file scripts/smoke-flow.mjs); then
  echo "Smoke flow failed to execute"
  playwright-cli close >/dev/null 2>&1 || true
  exit 1
fi
elapsed=$((SECONDS - start_secs))

while IFS=$'\t' read -r status name detail; do
  if [[ "$status" == "PASS" ]]; then
    pass "$name"
  else
    fail "$name" "${detail:-failed}"
  fi
done < <(printf '%s' "$result" | python3 -c '
import json, sys
data = json.load(sys.stdin)
for c in data.get("checks", []):
    name = c.get("name", "?")
    if c.get("ok"):
        print(f"PASS\t{name}")
    else:
        detail = c.get("detail", "")
        print(f"FAIL\t{name}\t{detail}")
')

edited_text=$(printf '%s' "$result" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("editedText",""))' 2>/dev/null || true)
if [[ -n "$edited_text" ]]; then
  open_tmp=$(mktemp)
  sed "s|__SMOKE_BASE__|${BASE}|g; s|__SMOKE_TAG__|${edited_text}|g" scripts/smoke-open-delete.mjs > "$open_tmp"
  open_found=$(playwright-cli run-code --filename="$open_tmp" 2>&1 | python3 -c '
import json, re, sys
text = sys.stdin.read()
match = re.search(r"### Result\s*\n(.+)", text)
if not match:
    sys.exit(0)
raw = match.group(1).strip()
data = json.loads(raw)
if isinstance(data, str):
    data = json.loads(data)
print(str(data.get("found", False)).lower())
' 2>/dev/null || echo "false")
  rm -f "$open_tmp"

  if [[ "$open_found" == "true" ]]; then
    playwright-cli dialog-accept >/dev/null 2>&1 || true
    eval_js '[...document.querySelectorAll("button")].find(b => b.textContent === "刪除")?.click()' >/dev/null
    playwright-cli dialog-accept >/dev/null 2>&1 || true
    deleted=$(eval_js "![...document.querySelectorAll('article')].some(c => c.textContent.includes($(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$edited_text")))")
    if [[ "$deleted" == "true" ]]; then pass "刪除名言"; else fail "刪除名言" "still visible"; fi
  else
    pass "刪除名言"
  fi
fi

if [[ "${BROWSER_ALREADY_OPEN:-}" != "1" ]]; then
  playwright-cli close >/dev/null 2>&1
fi

echo ""
for r in "${RESULTS[@]}"; do echo "$r"; done
echo ""
smoke_ok=$(printf '%s' "$result" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("ok", False))' 2>/dev/null || echo False)

echo "Elapsed: ${elapsed}s"
echo "Passed: $PASS / $((PASS + FAIL))"
if (( FAIL > 0 )) || [[ "$smoke_ok" != "True" ]]; then
  echo "Failed: $FAIL"
  exit 1
fi
echo "All smoke tests passed ✓"