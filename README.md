# 智慧語錄 (Wisdom Quotes)

個人名言收藏與管理，靜態部署至 GitHub Pages。介面為繁體中文，支援明暗主題。

**[設計 mockup →](./mockup/index.html)** · **[Roadmap →](https://github.com/akunzai/wisdom-quotes/issues/1)**

## 功能

- 名言新增、編輯、刪除與全文搜尋
- 依作者瀏覽、專注模式
- 明暗主題、JSON 匯入／匯出
- 可選的頁面小貓夥伴

## 本機開發

需要 [mise](https://mise.jdx.dev/)（會依 `mise.toml` 安裝 Node LTS 與 aube）。

```bash
git clone https://github.com/akunzai/wisdom-quotes.git
cd wisdom-quotes
aube install
aubr dev
```

開啟 <http://localhost:4321/wisdom-quotes/>。

```bash
aubr build    # 輸出至 dist/
aubr preview  # 預覽 production build
```

僅預覽 mockup：

```bash
npx serve mockup
```

## 部署

推送到 `main` 後，GitHub Actions 會 build 並部署至：

<https://akunzai.github.io/wisdom-quotes/>

## License

MIT