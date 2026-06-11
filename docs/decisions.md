# 設計決定ログ

## 2026-05-24: プロジェクト再生成（15分刻みへ）

- 名称: WAKU
- 対象: 面貸し美容師（最初の1人）
- ドメイン: waku.nkm.press
- repo: waku
- **時間粒度を 30分刻み → 15分刻みに変更**

### 30分 → 15分 への変更理由

面貸し美容師の施術は前髪カット・リタッチ等で15分単位が現実的なため、
30分固定だと開放できない隙間が生まれる。15分刻みで実態に寄せる。

### 影響範囲

- `lib/time.ts`: SLOTS_PER_DAY 48→96、`floorTo15Min`、`quartersOfHour` 追加
- `supabase/schema.sql`: コメントを「15分刻み」に。starts_at unique 制約は不変
- admin UI: フラットな時刻並びを廃止し「時間=行 / :00 :15 :30 :45=列」に再設計
  理由: 9-22時で52枠/日になり、フラット表示は密度が高すぎる
- 客側 `/`: open枠を時刻チップ表示（構造は粒度非依存なので変更最小）

### DB データは粒度非依存

slots は starts_at(timestamptz) を持つだけで「30分」「15分」を知らない。
粒度はアプリ側の生成ロジックの問題。DB スキーマは変更不要だった。

---

## 確定している設計判断

### slots.status の default = closed
WAKU は「管理者が開放した枠だけ見せる」アプリ。
default が open だと誤って枠を作っただけで公開される。
明示的な開放アクションがあって初めて open に遷移する設計を DB で保証。

### Supabase client は lazy 初期化
build 時に env を要求しないため、`createClient` を関数内で遅延実行。
- env が無くても build は通る
- env を要求するのは runtime まで遅らせる
- 原因切り分けが容易になる

### Next.js 16 / output:"export" 不使用
- output:"export" は app/api/**/route.ts と排他のため使わない
- Vercel Serverless 標準構成で動かす
- 「軽量UI」≠「静的書き出し」

### Cookie 認証: パスワードそのものを格納
- セッションテーブルや JWT 署名鍵を持たないシンプル化
- httpOnly + secure + sameSite=lax で防御
- 復活条件: 管理者複数化または監査要件が出たら JWT に移行

### admin 表示時間帯: 9:00 〜 22:00 固定
- DB は24時間分持てるが、UI は表示密度のために制限
- 復活条件: 「夜遅い時間も開放したい」要望が出たら設定化

---

## 採用しなかったもの（ボツ案 = 資産）

### 認証ライブラリ (NextAuth等)
- 理由: 客側に認証概念を持ち込まない。管理者1人なら env 1本で足りる
- 復活条件: 管理者が2人以上

### Prisma / Drizzle
- 理由: Supabase client 直書きの方が薄い。schema.sql 1ファイルで十分
- 復活条件: テーブルが10個超

### shadcn/ui
- 理由: 装飾より表示密度と静けさを優先
- 復活条件: なし（v0.1では復活させない）

### 通知機能（LINE Bot / メール / SMS）
- 理由: 「静かに共有」が目的。プッシュは摩擦の再導入
- 復活条件: 客から「気づけなかった」が3回以上

### 自動確定
- 理由: 「管理者が確認する」が v0.1 の責務。自動化はこの責務を消す
- 復活条件: なし

### 15分よりさらに細かい粒度（5分・10分）
- 理由: 美容施術で5分枠は非現実的。UI 密度も破綻する
- 復活条件: なし

### Supabase client の module top-level 初期化
- 理由: build 時 env 依存を生む（deploy 障害の原因になった）
- 代替: lazy 初期化が標準形

### next.config.js に output:"export"
- 理由: API routes と排他。共存不可
- 代替: Vercel Serverless 標準構成

### gh CLI 前提のセットアップ手順
- 理由: 環境依存が強すぎる（zsh: command not found: gh が出た）
- 代替: GitHub Web UI 手順も併記

---

## deploy 障害から得た教訓（赤ログ祭り）

### env が無くても build は通るべき
deploy パイプラインを infra 依存から切り離す。

### コード修正よりも先に状態確認
症状が複雑なときほど、原因を疑う前に
`git status` / `git log` / deploy URL 確認 で「いまの本当の状態」を取りに行く。
編集を重ねるほど分からなくなる。

### nested git を避ける
repo は sundubu-ai-context 内部で直接管理せず、独立 directory + 単独 git init。
embedded git repository warning 多発を回避。

---

## 連携メモ（三銃士）

- **ぐぷちゃん（戦略）**: 最初の面貸し美容師の選定、客への運用フロー、ADMIN_PASSWORD 運用
- **ゲンちゃん（検証）**: 競合調査、RLS 検証、httpOnly cookie 検証、Supabase 無料枠試算
