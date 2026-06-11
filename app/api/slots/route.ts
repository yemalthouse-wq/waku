import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date().toISOString();
  const { data, error } = await supabasePublic()
    .from("slots")
    .select("id, starts_at, status")
    .eq("status", "open")
    .gte("starts_at", now)
    .order("starts_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ slots: data });
}
