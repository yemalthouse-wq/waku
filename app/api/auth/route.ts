import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/auth { password }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.password) {
    return NextResponse.json({ error: "missing password" }, { status: 400 });
  }
  if (body.password !== adminPassword()) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, body.password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30日
  });
  return res;
}

// DELETE /api/auth ログアウト
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
