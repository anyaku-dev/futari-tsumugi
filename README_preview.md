# ローカルプレビュー & ASP統合ガイド

## ファイル構成

| ファイル | 説明 |
|---|---|
| `index.asp` | 本番用ASPファイル（編集不要） |
| `index_preview.html` | ローカルプレビュー用HTML（こちらを編集する） |
| `_preview_server.py` | プレビュー用ローカルサーバー |

---

## プレビューサーバーの起動

```bash
cd '/Users/imaishouta/Downloads/JTB様/futari-tsumugi'
python3 _preview_server.py &
```

ブラウザで開く: **http://localhost:8080/index_preview.html**

停止するには:
```bash
kill $(lsof -ti:8080)
```

---

## 作業フロー

```
index_preview.html を編集
        ↓
ブラウザでリロードして確認
        ↓
問題なければ index.asp の対応箇所に同じ変更を反映
```

---

## HTMLコメントの凡例（index_preview.html内）

| コメント記法 | 意味 |
|---|---|
| `<!-- [ASP] <% ... %> -->` | 単行のASPコードをコメント化したもの |
| `<!-- [ASP-BLOCK] ... [/ASP-BLOCK] -->` | 複数行ASPブロックをコメント化したもの |
| `<!-- [ASP-COND-PC-START] If Not isSmartPhone Then -->` | PC向け条件分岐の開始（この下のHTMLが有効） |
| `<!-- [ASP-COND-PC-END] -->` | PC向け条件分岐の終了 |
| `<!-- [ASP-COND-SP-START] Else ... -->` | SP向けコンテンツの開始（プレビューでは非表示） |
| `<!-- [SP] ... -->` | SP専用コンテンツ（非表示） |
| `<!-- [SP-INCLUDE] ... -->` | SP専用のサーバーサイドinclude（非表示） |
| `<!-- [LOCAL-UNAVAILABLE] ... -->` | JTBサーバー専用ファイル（ローカルでは取得不可） |
| `<!-- [PREVIEW-HIDDEN: ...] ... [/PREVIEW-HIDDEN] -->` | プレビュー表示上の都合で一時的に非表示にした箇所 |

---

## index_preview.html → index.asp への反映手順

### 1. 変更箇所を特定する

`index_preview.html` で変更した箇所のHTMLを確認する。  
ASPのコメントマーカー（`[ASP-COND-*]` など）は無視してよい。

### 2. index.asp の対応箇所を探す

変更したHTMLの前後数行をキーワードに `index.asp` 内を検索する。

### 3. 同じ変更を index.asp に適用する

- HTMLの変更内容をそのまま `index.asp` の対応箇所に適用する
- ASPの `<% %>` ブロックや `<!-- #Include -->` は **触らない**

---

## 一時的にコメントアウトした箇所（PREVIEW-HIDDEN）

| 箇所 | 理由 | 元に戻す方法 |
|---|---|---|
| パンくずナビ (`jtb-nav-breadcrumb`) | `/_common/css/common.css` がJTBサーバー専用でローカル取得不可のためスタイルなしで表示されてしまう | `[PREVIEW-HIDDEN: ...]` と `[/PREVIEW-HIDDEN]` のコメントタグを削除する |

---

## ローカルで利用できないJTBサーバー依存リソース

以下はJTBのサーバー上にのみ存在するため、ローカルプレビューでは読み込まれません。  
コンテンツ編集への影響はありません。

- `/_common/css/headfooter.css`
- `/_common/css/common.css`
- `/_common/header/header.html`
- `/_common/footer/footer.html`
- `/ExtSite/jtb/inspect.js`
