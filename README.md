# WAKU

> 空き時間を、静かに共有する。

WAKU は予約管理システムではない。
**15分刻みの空き枠を共有するだけ** のアプリ。

LINE で「いつ空いてますか？」を毎回往復する摩擦をなくす。
最初の対象は面貸し美容師。

---

## v0.1 の責務

1. 管理者が空き枠を開放する
2. 客が見る
3. 客が仮リクエストする
4. 管理者が確認する

これだけ。

## 状態モデル

```
closed    → 非公開（初期値）
open      → 公開中・受付可
requested → 仮リクエスト中
confirmed → 確定済
```

客側に見えるのは `open` のみ。

## やらないこと

- 客側ログイン / 会員登録
- 決済
- CRM・顧客管理
- POS連携
- 通知の自動化（LINE Bot等）
- 複数スタッフ対応
- 自動確定
- 予約変更フロー

詳細は [`docs/scope.md`](./docs/scope.md)

---

## Stack

- Next.js 16 (App Router) / TypeScript
- Tailwind CSS
- Supabase (Postgres)
- Vercel

---

## Setup

```bash
# 1. 依存インストール
npm install

# 2. 環境変数
cp .env.local.example .env.local
# .env.local を編集：
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   ADMIN_PASSWORD

# 3. Supabase にスキーマ適用
# Supabase Dashboard > SQL Editor で supabase/schema.sql を実行

# 4. 起動
npm run dev
```

開発: http://localhost:3000
管理: http://localhost:3000/admin

> env が無くても build は通る（lazy 初期化）。
> env を要求するのは runtime に API を叩いた時だけ。

---

## Deploy

main push で Vercel が waku.nkm.press にデプロイ。

Vercel 側で同じ環境変数を設定すること。
`output: "export"` は使わない（API routes と排他のため）。

---

## 設計原則

- **それは明日も続くか？**
- **便利にすると死ぬ**
- **静かに共有する**

機能追加で太らせない。
要望が来たら [`docs/scope.md`](./docs/scope.md) の判断基準を通す。

---

## Repo

- GitHub: `waku`
- Domain: waku.nkm.press
- Project: The Garage
