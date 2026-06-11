import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdminFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

// 管理者：リクエスト一覧（slotとjoin）
export async function GET(req: NextRequest) {
  if (!isAdminFromRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("requests")
    .select(
      `id, guest_name, guest_contact, note, created_at,
       slot:slot_id ( id, starts_at, status )`
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data });
}

// 管理者：requested → confirmed に遷移
// body: { slot_id: uuid }
export async function POST(req: NextRequest) {
  if (!isAdminFromRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.slot_id) {
    return NextResponse.json({ error: "missing slot_id" }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("slots")
    .update({ status: "confirmed" })
    .eq("id", body.slot_id)
    .eq("status", "requested")
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ slot: data });
}
