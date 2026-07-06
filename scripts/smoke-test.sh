#!/usr/bin/env bash
# Local smoke test for 智慧語錄 — requires preview/dev server and playwright-cli.
set -uo pipefail

BASE="${SMOKE_BASE_URL:-http://localhost:4322/wisdom-quotes/}"
PASS=0
FAIL=0
RESULTS=()

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

SMOKE_TAG="SMOKE_$(date +%s)"

run_code_file() {
  local src="$1" tmp
  tmp=$(mktemp)
  sed "s|__SMOKE_BASE__|${BASE}|g; s|__SMOKE_TAG__|${SMOKE_TAG}|g" "$src" > "$tmp"
  playwright-cli run-code --filename="$tmp" 2>&1 | python3 -c '
import json, re, sys
text = sys.stdin.read()
match = re.search(r"### Result\s*\n(.+)", text, re.S)
if not match:
    sys.exit(1)
raw = match.group(1).strip()
try:
    data = json.loads(raw)
except json.JSONDecodeError:
    data = raw
if isinstance(data, str):
    data = json.loads(data)
print(json.dumps(data))
'
  rm -f "$tmp"
}

run_crud() { run_code_file scripts/smoke-crud.mjs; }

run_delete() {
  local open_result found
  open_result=$(run_code_file scripts/smoke-open-delete.mjs)
  found=$(printf '%s' "$open_result" | parse_json_result found 2>/dev/null | tr '[:upper:]' '[:lower:]')
  if [[ "$found" != "true" ]]; then
    echo '{"deleted":true}'
    return
  fi
  playwright-cli dialog-accept >/dev/null 2>&1
  eval_js '[...document.querySelectorAll("button")].find(b => b.textContent === "刪除")?.click()' >/dev/null
  sleep 0.5
  playwright-cli dialog-accept >/dev/null 2>&1 || true
  sleep 1
  if [[ "$(eval_js '![...document.querySelectorAll("article")].some(c => c.textContent.includes("'"$SMOKE_TAG"'"))')" == "true" ]]; then
    echo '{"deleted":true}'
  else
    echo '{"deleted":false}'
  fi
}

js_str() {
  python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$1"
}

set_input() {
  local val
  val=$(js_str "$2")
  eval_js "(() => {
    const el = document.querySelector('$1');
    if (!el) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(el, $val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()"
}

assert_eq() {
  local name="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then pass "$name"; else fail "$name" "expected '$expected', got '$actual'"; fi
}

assert_contains() {
  local name="$1" needle="$2" haystack="$3"
  if [[ "$haystack" == *"$needle"* ]]; then pass "$name"; else fail "$name" "missing '$needle' (got '$haystack')"; fi
}

assert_true() {
  local name="$1" actual="$2"
  if [[ "$actual" == "true" ]]; then pass "$name"; else fail "$name" "got '$actual'"; fi
}

echo "=== 智慧語錄 Smoke Test ==="
echo "Base URL: $BASE"
echo ""

playwright-cli close >/dev/null 2>&1 || true
playwright-cli open "$BASE" >/dev/null 2>&1
sleep 2

# 0. Load demo quotes via settings (no auto-seed on first visit)
playwright-cli goto "${BASE}settings/" >/dev/null 2>&1
sleep 1.5
eval_js '[...document.querySelectorAll("button")].find(b => b.textContent === "匯入範例")?.click()' >/dev/null
sleep 1.5
playwright-cli goto "$BASE" >/dev/null 2>&1
sleep 1.5

# 1. Home
assert_eq "首頁標題" "智慧語錄 — 名言" "$(eval_js 'document.title')"
nav=$(eval_js 'JSON.stringify([...document.querySelectorAll("nav a")].map(a => a.getAttribute("href")))')
assert_contains "導覽：作者連結" "/wisdom-quotes/authors/" "$nav"
assert_contains "導覽：設定連結" "/wisdom-quotes/settings/" "$nav"
count=$(eval_js 'document.querySelectorAll("article").length')
if [[ "$count" =~ ^[0-9]+$ && "$count" -ge 50 ]]; then pass "首頁載入名言 ($count 則)"; else fail "首頁載入名言" "expected >= 50, got '$count'"; fi
assert_true "每日一思 hero" "$(eval_js '!!document.querySelector(".hero-quote")')"

# 2. Search
set_input 'input[type=search]' '千里之行' >/dev/null
sleep 0.8
assert_eq "搜尋「千里之行」" "1" "$(eval_js 'document.querySelectorAll("article").length')"
set_input 'input[type=search]' '' >/dev/null
sleep 0.8

# 3. Authors
playwright-cli goto "${BASE}authors/" >/dev/null 2>&1
sleep 1.5
assert_eq "作者頁標題" "智慧語錄 — 作者" "$(eval_js 'document.title')"
authors=$(eval_js 'document.querySelectorAll(".author-card").length')
if [[ "$authors" =~ ^[0-9]+$ && "$authors" -gt 0 ]]; then pass "作者卡片 ($authors 位)"; else fail "作者卡片" "got '$authors'"; fi

# 4. Settings
playwright-cli goto "${BASE}settings/" >/dev/null 2>&1
sleep 1.5
assert_eq "設定頁標題" "智慧語錄 — 設定" "$(eval_js 'document.title')"
assert_true "匯入範例按鈕" "$(eval_js '[...document.querySelectorAll("button")].some(b => b.textContent === "匯入範例")')"
assert_true "匯出按鈕" "$(eval_js '[...document.querySelectorAll("button")].some(b => b.textContent.includes("匯出"))')"
assert_true "匯入按鈕" "$(eval_js '[...document.querySelectorAll("label")].some(l => l.textContent.includes("匯入"))')"
assert_true "清空按鈕" "$(eval_js '[...document.querySelectorAll("button")].some(b => b.textContent === "清空")')"
assert_eq "隱藏 Google Drive" "false" "$(eval_js 'document.body.textContent.includes("Google Drive")')"

# 5. Theme toggle
playwright-cli goto "$BASE" >/dev/null 2>&1
sleep 1.5
theme_before=$(eval_js 'document.documentElement.dataset.theme')
eval_js 'document.querySelector(".header-actions button")?.click()' >/dev/null
sleep 0.5
theme_after=$(eval_js 'document.documentElement.dataset.theme')
if [[ -n "$theme_before" && -n "$theme_after" && "$theme_before" != "$theme_after" ]]; then
  pass "主題切換 ($theme_before → $theme_after)"
else
  fail "主題切換" "$theme_before → $theme_after"
fi

# 6–9. CRUD + Focus (Playwright locators for React forms)
crud=$(run_crud)
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

crud_fields=$(printf '%s' "$crud" | parse_json_result before afterAdd hasDelete edited focusHref focusOk 2>/dev/null || true)

delete_result=$(run_delete)
deleted=$(printf '%s' "$delete_result" | parse_json_result deleted 2>/dev/null || echo "false")

before=$(echo "$crud_fields" | sed -n '1p')
after_add=$(echo "$crud_fields" | sed -n '2p')
has_delete=$(echo "$crud_fields" | sed -n '3p' | tr '[:upper:]' '[:lower:]')
edited=$(echo "$crud_fields" | sed -n '4p' | tr '[:upper:]' '[:lower:]')
focus_href=$(echo "$crud_fields" | sed -n '5p')
focus_ok=$(echo "$crud_fields" | sed -n '6p' | tr '[:upper:]' '[:lower:]')
deleted=$(echo "$deleted" | tr '[:upper:]' '[:lower:]')

assert_eq "新增名言" "$((before + 1))" "$after_add"
assert_true "編輯表單刪除按鈕" "$has_delete"
assert_true "編輯儲存" "$edited"
if [[ "$focus_href" == *"/focus/"* ]]; then pass "專注連結格式"; else fail "專注連結格式" "$focus_href"; fi
assert_true "專注模式內容" "$focus_ok"
assert_true "刪除名言" "$deleted"

# 10. Author filter
playwright-cli goto "${BASE}?author=%E8%98%87%E6%A0%BC%E6%8B%89%E5%BA%95" >/dev/null 2>&1
sleep 2
title=$(eval_js 'document.querySelector(".quotes-title")?.textContent || ""')
assert_contains "作者篩選標題" "蘇格拉底" "$title"
assert_eq "作者篩選數量" "1" "$(eval_js 'document.querySelectorAll("article").length')"

# 11. Page cat
playwright-cli goto "$BASE" >/dev/null 2>&1
sleep 1.5
assert_true "頁面小貓" "$(eval_js '!!document.querySelector(".pet.cat")')"

playwright-cli close >/dev/null 2>&1

echo ""
for r in "${RESULTS[@]}"; do echo "$r"; done
echo ""
echo "通過: $PASS / $((PASS + FAIL))"
if (( FAIL > 0 )); then echo "失敗: $FAIL"; exit 1; fi
echo "全部通過 ✓"