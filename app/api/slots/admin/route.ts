import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdminFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 管理者用：すべての枠を取得（status指定可）
export async function GET(req: NextRequest) {
  if (!isAdminFromRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? new Date().toISOString();

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("slots")
    .select("id, starts_at, status, updated_at")
    .gte("starts_at", from)
    .order("starts_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slots: data });
}

// 管理者用：枠を作成 or status 更新（toggle）
// body: { starts_at: ISO, status: 'open' | 'closed' }
export async function POST(req: NextRequest) {
  if (!isAdminFromRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { starts_at, status } = body as { starts_at: string; status: string };

  if (!starts_at || !["open", "closed"].includes(status)) {
    return NextResponse.json({ error: "invalid params" }, { status: 400 });
  }

  const sb = supabaseAdmin();

  // upsert: starts_at が unique なので存在すれば更新
  const { data, error } = await sb
    .from("slots")
    .upsert({ starts_at, status }, { onConflict: "starts_at" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slot: data });
}
