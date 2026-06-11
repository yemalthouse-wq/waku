import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "waku_admin";

// 簡易：パスワードそのものを Cookie に入れて毎回検証
// v0.1 では管理者1人なのでこれで足りる。
// 復活条件: 管理者が2人以上になったら JWT 検討。

export function adminPassword(): string {
  const p = process.env.ADMIN_PASSWORD;
  if (!p) throw new Error("ADMIN_PASSWORD not set");
  return p;
}

// Next 15+ では cookies() が async になっている。
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const c = store.get(COOKIE_NAME);
  if (!c) return false;
  return c.value === adminPassword();
}

export function isAdminFromRequest(req: NextRequest): boolean {
  const c = req.cookies.get(COOKIE_NAME);
  if (!c) return false;
  return c.value === adminPassword();
}

export const ADMIN_COOKIE = COOKIE_NAME;
