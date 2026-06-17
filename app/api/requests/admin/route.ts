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

// 管理者：slot の状態遷移
// body: { slot_id: uuid, action?: 'confirm' | 'reopen' }
//   confirm (既定): requested -> confirmed
//   reopen        : requested -> open（差し戻し。紐づく request は削除）
export async function POST(req: NextRequest) {
  if (!isAdminFromRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.slot_id) {
    return NextResponse.json({ error: "missing slot_id" }, { status: 400 });
  }

  const action: "confirm" | "reopen" = body.action === "reopen" ? "reopen" : "confirm";
  const sb = supabaseAdmin();

  if (action === "reopen") {
    // requested -> open に差し戻し。
    // 客のキャンセル/連絡不通で requested のまま凍結した枠を再公開する。
    // 紐づく request 行は削除（この予約は無かったことにする）。
    const { data, error } = await sb
      .from("slots")
      .update({ status: "open" })
      .eq("id", body.slot_id)
      .eq("status", "requested")
      .select("id, starts_at, status, updated_at");

    if (error) {
      return NextResponse.json(
        { error: error.message, code: error.code ?? null },
        { status: 500 }
      );
    }
    if (!data || data.length === 0) {
      // requested 以外（既に open/confirmed/closed）だった等
      return NextResponse.json(
        { error: "slot not in 'requested' state (cannot reopen)" },
        { status: 409 }
      );
    }

    // 該当 slot の request を削除（宙に浮く予約を残さない）
    const { error: delErr } = await sb
      .from("requests")
      .delete()
      .eq("slot_id", body.slot_id);
    if (delErr) {
      // slot は open に戻ったが request 削除に失敗。握り潰さず報告。
      return NextResponse.json(
        { error: `slot reopened but request cleanup failed: ${delErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ slot: data[0] });
  }

  // action === "confirm": requested -> confirmed（既存挙動）
  const { data, error } = await sb
    .from("slots")
    .update({ status: "confirmed" })
    .eq("id", body.slot_id)
    .eq("status", "requested")
    .select("id, starts_at, status, updated_at");

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code ?? null },
      { status: 500 }
    );
  }
  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "slot not in 'requested' state (cannot confirm)" },
      { status: 409 }
    );
  }
  return NextResponse.json({ slot: data[0] });
}
