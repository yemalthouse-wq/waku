"use client";

import { useEffect, useState } from "react";
import { formatDate, formatHM, formatDateTime } from "@/lib/time";

type Slot = {
  id: string;
  starts_at: string;
  status: string;
};

export default function Home() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Slot | null>(null);

  useEffect(() => {
    fetch("/api/slots")
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, []);

  // 日付ごとにグルーピング
  const grouped = slots.reduce<Record<string, Slot[]>>((acc, s) => {
    const d = formatDate(s.starts_at);
    if (!acc[d]) acc[d] = [];
    acc[d].push(s);
    return acc;
  }, {});

  return (
    <main className="min-h-screen px-6 md:px-12 py-16 md:py-24 max-w-3xl mx-auto">
      <header className="mb-16 md:mb-24">
        <h1 className="font-serif text-5xl md:text-7xl tracking-tight leading-none">
          waku
        </h1>
        <p className="mt-6 text-muted text-sm tracking-wide">
          空き時間を、静かに共有する。
        </p>
      </header>

      {loading ? (
        <p className="text-muted text-sm">読み込み中...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="border-t border-line pt-8">
          <p className="text-muted text-sm leading-relaxed">
            現在、公開されている空き枠はありません。
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(grouped).map(([date, ss]) => (
            <section key={date}>
              <h2 className="font-serif text-2xl mb-4 border-b border-line pb-2">
                {date}
              </h2>
              <div className="flex flex-wrap gap-2">
                {ss.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    className="font-mono text-sm px-4 py-2 border border-ink hover:bg-ink hover:text-paper transition-colors"
                  >
                    {formatHM(s.starts_at)}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selected && (
        <RequestModal
          slot={selected}
          onClose={() => setSelected(null)}
          onDone={() => {
            setSelected(null);
            setSlots((prev) => prev.filter((x) => x.id !== selected.id));
          }}
        />
      )}

      <footer className="mt-24 pt-8 border-t border-line text-muted text-xs tracking-wide">
        <p>仮リクエスト後、管理者からご連絡します。</p>
      </footer>
    </main>
  );
}

function RequestModal({
  slot,
  onClose,
  onDone,
}: {
  slot: Slot;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim() || !contact.trim()) {
      setError("お名前と連絡先は必須です。");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot_id: slot.id,
        guest_name: name.trim(),
        guest_contact: contact.trim(),
        note: note.trim() || null,
      }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "送信に失敗しました。");
      setSubmitting(false);
      return;
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-end md:items-center justify-center z-50">
      <div className="bg-paper w-full md:max-w-md border border-ink p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-muted text-xs tracking-wide mb-1">仮リクエスト</p>
            <p className="font-serif text-2xl">{formatDateTime(slot.starts_at)}</p>
          </div>
          <button onClick={onClose} className="text-muted text-sm">
            ×
          </button>
        </div>

        <div className="space-y-4">
          <Field label="お名前">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-b border-ink bg-transparent py-2 focus:outline-none"
            />
          </Field>
          <Field label="ご連絡先（LINE / 電話 など）">
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full border-b border-ink bg-transparent py-2 focus:outline-none"
            />
          </Field>
          <Field label="ご要望（任意）">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full border border-line bg-transparent p-2 focus:outline-none focus:border-ink"
            />
          </Field>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full py-3 bg-ink text-paper text-sm tracking-wider disabled:opacity-40 mt-4"
          >
            {submitting ? "送信中..." : "リクエストを送る"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-muted text-xs tracking-wide block mb-1">{label}</span>
      {children}
    </label>
  );
}
