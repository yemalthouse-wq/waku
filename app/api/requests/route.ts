import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 客側：仮リクエスト送信
// 同時にスロットの status を requested に遷移させる（service_role で）
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const { slot_id, guest_name, guest_contact, note } = body;
  if (!slot_id || !guest_name || !guest_contact) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const sb = supabaseAdmin();

  // 1. slot がまだ open か確認
  const { data: slot, error: e1 } = await sb
    .from("slots")
    .select("id, status")
    .eq("id", slot_id)
    .single();

  if (e1 || !slot) {
    return NextResponse.json({ error: "slot not found" }, { status: 404 });
  }
  if (slot.status !== "open") {
    return NextResponse.json({ error: "slot not available" }, { status: 409 });
  }

  // 2. requests に挿入
  const { error: e2 } = await sb.from("requests").insert({
    slot_id,
    guest_name: String(guest_name).slice(0, 100),
    guest_contact: String(guest_contact).slice(0, 200),
    note: note ? String(note).slice(0, 500) : null,
  });
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  // 3. slot を requested に遷移
  const { error: e3 } = await sb
    .from("slots")
    .update({ status: "requested" })
    .eq("id", slot_id);
  if (e3) return NextResponse.json({ error: e3.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
