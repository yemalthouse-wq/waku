-- WAKU v0.1 schema
-- 15分刻みの空き枠共有アプリ

-- slots: 管理者が開放した枠
create table slots (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null unique,        -- 15分刻みの開始時刻（重複防止）
  status text not null default 'closed',        -- closed | open | requested | confirmed
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- status の制約
alter table slots add constraint slots_status_check
  check (status in ('closed', 'open', 'requested', 'confirmed'));

-- 客側の高速検索用
create index idx_slots_open on slots (starts_at) where status = 'open';
create index idx_slots_status on slots (status, starts_at);

-- requests: 客が押した仮リクエスト
create table requests (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references slots(id) on delete cascade,
  guest_name text not null,
  guest_contact text not null,           -- LINE ID / 電話 / なんでも文字列
  note text,
  created_at timestamptz default now()
);

create index idx_requests_slot on requests (slot_id);
create index idx_requests_created on requests (created_at desc);

-- updated_at 自動更新
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_slots_updated_at
  before update on slots
  for each row execute function set_updated_at();

-- RLS: 客側 anon は open 枠だけ読める / requests は書き込みのみ
alter table slots enable row level security;
alter table requests enable row level security;

-- anon: open な slot だけ読める
create policy slots_anon_read on slots
  for select to anon
  using (status = 'open');

-- anon: requests に挿入のみ（読み取り不可）
create policy requests_anon_insert on requests
  for insert to anon
  with check (true);

-- service_role は RLS をバイパスするので個別 policy 不要
