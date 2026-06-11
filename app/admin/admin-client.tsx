"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  daysFromToday,
  formatDate,
  formatHM,
  quartersOfHour,
} from "@/lib/time";

type Slot = {
  id?: string;
  starts_at: string;
  status: "closed" | "open" | "requested" | "confirmed";
};

type RequestRow = {
  id: string;
  guest_name: string;
  guest_contact: string;
  note: string | null;
  created_at: string;
  slot: { id: string; starts_at: string; status: string } | null;
};

const DAYS_AHEAD = 14;
const HOUR_START = 9;  // 表示開始時刻
const HOUR_END = 22;   // 表示終了時刻（この時刻は含まない）

export default function AdminClient() {
  const router = useRouter();
  const [tab, setTab] = useState<"slots" | "requests">("slots");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [s, r] = await Promise.all([
      fetch("/api/slots/admin").then((x) => x.json()),
      fetch("/api/requests/admin").then((x) => x.json()),
    ]);
    setSlots(s.slots ?? []);
    setRequests(r.requests ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  // slot toggle
  async function toggleSlot(starts_at: string, current?: Slot) {
    // requested/confirmed の枠は触らせない
    if (current?.status === "requested" || current?.status === "confirmed") return;

    const newStatus: "open" | "closed" =
      current?.status === "open" ? "closed" : "open";

    setSavingKey(starts_at);
    const res = await fetch("/api/slots/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ starts_at, status: newStatus }),
    });
    if (res.ok) {
      const { slot } = await res.json();
      setSlots((prev) => {
        const i = prev.findIndex((x) => x.starts_at === starts_at);
        if (i === -1) return [...prev, slot];
        const next = [...prev];
        next[i] = slot;
        return next;
      });
    }
    setSavingKey(null);
  }

  async function confirmRequest(slotId: string) {
    const res = await fetch("/api/requests/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot_id: slotId }),
    });
    if (res.ok) load();
  }

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-6 md:px-12 py-12">
      <header className="flex justify-between items-end mb-12 border-b border-line pb-6">
        <div>
          <p className="text-muted text-xs tracking-wide">WAKU</p>
          <h1 className="font-serif text-4xl">admin</h1>
        </div>
        <button onClick={logout} className="text-muted text-sm hover:text-ink">
          logout
        </button>
      </header>

      <nav className="flex gap-6 mb-12 text-sm">
        <TabButton active={tab === "slots"} onClick={() => setTab("slots")}>
          枠を開放
        </TabButton>
        <TabButton active={tab === "requests"} onClick={() => setTab("requests")}>
          リクエスト
          {requests.filter((r) => r.slot?.status === "requested").length > 0 && (
            <span className="ml-2 inline-block w-2 h-2 rounded-full bg-ink"></span>
          )}
        </TabButton>
      </nav>

      {loading ? (
        <p className="text-muted text-sm">読み込み中...</p>
      ) : tab === "slots" ? (
        <SlotsGrid slots={slots} onToggle={toggleSlot} savingKey={savingKey} />
      ) : (
        <RequestsList requests={requests} onConfirm={confirmRequest} />
      )}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`pb-2 border-b-2 transition-colors ${
        active ? "border-ink" : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function SlotsGrid({
  slots,
  onToggle,
  savingKey,
}: {
  slots: Slot[];
  onToggle: (starts_at: string, current?: Slot) => void;
  savingKey: string | null;
}) {
  const days = useMemo(() => daysFromToday(DAYS_AHEAD), []);
  const slotMap = useMemo(() => {
    const m = new Map<string, Slot>();
    for (const s of slots) m.set(s.starts_at, s);
    return m;
  }, [slots]);

  const hours = useMemo(() => {
    const out: number[] = [];
    for (let h = HOUR_START; h < HOUR_END; h++) out.push(h);
    return out;
  }, []);

  return (
    <div className="space-y-12">
      <p className="text-muted text-xs leading-relaxed">
        押すと開放（open）↔ 非公開（closed）が切り替わります。15分刻み。
        <br />
        リクエスト中・確定済の枠はロックされます。
      </p>

      {days.map((day) => {
        const now = new Date();
        return (
          <section key={day.toISOString()}>
            <h2 className="font-serif text-xl mb-3 border-b border-line pb-2">
              {formatDate(day)}
            </h2>

            <div className="space-y-1">
              {hours.map((hour) => {
                const quarters = quartersOfHour(day, hour);
                return (
                  <div key={hour} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted w-10 shrink-0 text-right">
                      {String(hour).padStart(2, "0")}
                    </span>
                    <div className="grid grid-cols-4 gap-1 flex-1">
                      {quarters.map((d) => {
                        const iso = d.toISOString();
                        const existing = slotMap.get(iso);
                        const past = d.getTime() < now.getTime();
                        const status = existing?.status ?? "closed";
                        const locked =
                          past ||
                          status === "requested" ||
                          status === "confirmed";
                        const saving = savingKey === iso;

                        const cls = (() => {
                          if (past) return "text-muted/40 border-line/40";
                          if (status === "open")
                            return "bg-ink text-paper border-ink";
                          if (status === "requested")
                            return "bg-paper text-ink border-ink border-dashed";
                          if (status === "confirmed")
                            return "bg-muted/30 text-ink border-muted line-through";
                          return "border-line text-muted hover:border-ink hover:text-ink";
                        })();

                        return (
                          <button
                            key={iso}
                            disabled={locked || saving}
                            onClick={() => onToggle(iso, existing)}
                            className={`font-mono text-xs py-2 border transition-colors ${cls} ${
                              saving ? "opacity-50" : ""
                            } ${locked ? "cursor-not-allowed" : ""}`}
                            title={`${formatHM(d)} / ${status}`}
                          >
                            {formatHM(d)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted pt-6 border-t border-line">
      <LegendItem swatch="border-line" label="非公開 (closed)" />
      <LegendItem swatch="bg-ink border-ink" label="公開中 (open)" />
      <LegendItem swatch="border-ink border-dashed" label="リクエスト中" />
      <LegendItem swatch="bg-muted/30 border-muted" label="確定済" />
    </div>
  );
}

function LegendItem({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-block w-4 h-4 border ${swatch}`}></span>
      {label}
    </span>
  );
}

function RequestsList({
  requests,
  onConfirm,
}: {
  requests: RequestRow[];
  onConfirm: (slotId: string) => void;
}) {
  const pending = requests.filter((r) => r.slot?.status === "requested");
  const confirmed = requests.filter((r) => r.slot?.status === "confirmed");

  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-serif text-xl mb-4 border-b border-line pb-2">
          確認待ち（{pending.length}）
        </h2>
        {pending.length === 0 ? (
          <p className="text-muted text-sm">未確認のリクエストはありません。</p>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <RequestCard key={r.id} req={r} onConfirm={onConfirm} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif text-xl mb-4 border-b border-line pb-2 text-muted">
          確定済み（{confirmed.length}）
        </h2>
        {confirmed.length === 0 ? (
          <p className="text-muted text-sm">確定済みはありません。</p>
        ) : (
          <div className="space-y-3">
            {confirmed.map((r) => (
              <RequestCard key={r.id} req={r} muted />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RequestCard({
  req,
  onConfirm,
  muted,
}: {
  req: RequestRow;
  onConfirm?: (slotId: string) => void;
  muted?: boolean;
}) {
  if (!req.slot) return null;
  return (
    <div
      className={`border p-4 md:p-6 ${
        muted ? "border-line text-muted" : "border-ink"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <p className="font-mono text-xs text-muted mb-1">
            {new Date(req.created_at).toLocaleString("ja-JP")}
          </p>
          <p className="font-serif text-xl mb-2">
            {formatDate(req.slot.starts_at)} {formatHM(req.slot.starts_at)}
          </p>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted text-xs mr-2">name</span>
              {req.guest_name}
            </p>
            <p>
              <span className="text-muted text-xs mr-2">contact</span>
              {req.guest_contact}
            </p>
            {req.note && (
              <p className="text-sm mt-2 whitespace-pre-wrap border-l-2 border-line pl-3">
                {req.note}
              </p>
            )}
          </div>
        </div>

        {onConfirm && req.slot && (
          <button
            onClick={() => onConfirm(req.slot!.id)}
            className="px-6 py-3 bg-ink text-paper text-sm tracking-wider whitespace-nowrap"
          >
            確定する
          </button>
        )}
      </div>
    </div>
  );
}
