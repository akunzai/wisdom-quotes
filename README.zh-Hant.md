# 智慧語錄

個人名言收藏應用，支援繁體中文、英文、日文介面，以及明暗主題與瀏覽器本地儲存。

## 功能

- 新增、編輯、刪除與搜尋名言
- 依作者瀏覽與專注模式單則閱讀
- 明暗主題、語言切換與 JSON 匯入／匯出
- 可選的頁面小貓夥伴

## 環境需求

- [mise](https://mise.jdx.dev/) — 依 `mise.toml` 安裝 Node LTS 與 [aube](https://aube.jdx.dev/)

## 開始使用

```bash
git clone https://github.com/akunzai/wisdom-quotes.git
cd wisdom-quotes
aube install
aubr dev
```

開啟 [http://localhost:4321/wisdom-quotes/](http://localhost:4321/wisdom-quotes/)。

## 指令

| 指令 | 說明 |
|------|------|
| `aubr dev` | 啟動開發伺服器 |
| `aubr build` | 型別檢查並建置至 `dist/` |
| `aubr preview` | 預覽正式建置 |
| `aubr typecheck` | 執行 Astro／TypeScript 檢查 |
| `aubr lint` | 程式碼檢查 |
| `aubr format` | Prettier 格式化 |

## 多語言說明

| 檔案 | 語言 |
|------|------|
| [README.md](README.md) | 英文（預設） |
| [README.zh-Hant.md](README.zh-Hant.md) | 繁體中文 |
| [README.ja.md](README.ja.md) | 日文 |

## 貢獻

歡迎提出 Issue 與 Pull Request。大型變更請先開 Issue 討論。