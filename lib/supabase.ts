import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy 初期化:
// build 時に env を要求しないことで、env 未設定でも build を通す。
// 「env が無くても build は通るべき」原則（decisions.md 参照）

let _public: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

// 客側 / 公開読み取り用
export function supabasePublic(): SupabaseClient {
  if (_public) return _public;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env not set (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)"
    );
  }
  _public = createClient(url, key, { auth: { persistSession: false } });
  return _public;
}

// 管理者操作用（API route 内のみで使う）
export function supabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env not set (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
    );
  }
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}
