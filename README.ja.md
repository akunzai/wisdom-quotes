# 名言コレクション

多言語 UI（繁体字中国語・英語・日本語）、ライト／ダークテーマ、ブラウザローカルストレージに対応した個人用名言コレクションアプリです。

## 機能

- 名言の作成・編集・削除・検索
- 著者別閲覧と集中モードでの一則読み
- ライト／ダークテーマ、言語切り替え、JSON のインポート／エクスポート
- オプションのページを歩き回る猫の相棒

## 必要条件

- [mise](https://mise.jdx.dev/) — `mise.toml` に従い Node LTS と [aube](https://aube.jdx.dev/) をインストール

## はじめに

```bash
git clone https://github.com/akunzai/wisdom-quotes.git
cd wisdom-quotes
aube install
aubr dev
```

[http://localhost:4321/wisdom-quotes/](http://localhost:4321/wisdom-quotes/) を開きます。

## スクリプト

| コマンド | 説明 |
|---------|------|
| `aubr dev` | 開発サーバーを起動 |
| `aubr build` | 型チェックして `dist/` にビルド |
| `aubr preview` | 本番ビルドをプレビュー |
| `aubr typecheck` | Astro／TypeScript チェック |
| `aubr lint` | コードのリント |
| `aubr format` | Prettier でフォーマット |

## ローカライゼーション

| ファイル | 言語 |
|---------|------|
| [README.md](README.md) | 英語（デフォルト） |
| [README.zh-Hant.md](README.zh-Hant.md) | 繁体字中国語 |
| [README.ja.md](README.ja.md) | 日本語 |

## コントリビューション

Issue と Pull Request を歓迎します。大きな変更の前に Issue を開いてください。