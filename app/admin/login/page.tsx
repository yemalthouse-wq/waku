"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("パスワードが違います。");
      setSubmitting(false);
      return;
    }
    router.push("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <h1 className="font-serif text-4xl mb-12">admin</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="password"
          className="w-full border-b border-ink bg-transparent py-3 focus:outline-none font-mono text-sm"
        />
        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        <button
          onClick={submit}
          disabled={submitting || !password}
          className="mt-8 w-full py-3 bg-ink text-paper text-sm tracking-wider disabled:opacity-40"
        >
          {submitting ? "認証中..." : "入る"}
        </button>
      </div>
    </main>
  );
}
