import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import AdminClient from "./admin-client";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
  return <AdminClient />;
}
