"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Play, CheckCircle2, XCircle, ExternalLink, ShieldCheck } from "lucide-react";
import { getSupabase } from "@/lib/sb";

type Order = {
  id: string;
  email: string;
  service: string;
  link: string;
  quantity: number;
  charge: number;
  status: string;
  created_at: string;
};

const LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  in_progress: "In progress",
  completed: "Completed",
  partial: "Partial",
  canceled: "Canceled",
  failed: "Failed",
};

const COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  partial: "bg-orange-100 text-orange-800",
  canceled: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
};

async function token() {
  const { data } = await getSupabase().auth.getSession();
  return data?.session?.access_token ?? null;
}

export default function AdminPage() {
  const [view, setView] = useState<"open" | "done">("open");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const t = await token();
    if (!t) {
      setError("Please log in first at /login.");
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/admin/orders?view=${view}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const out = await res.json();
    if (!res.ok) setError(out.error ?? "Could not load orders.");
    else setOrders(out.orders ?? []);
    setLoading(false);
  }, [view]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(orderId: string, action: string) {
    if (
      action === "cancel" &&
      !window.confirm("Cancel this order and refund the customer's wallet?")
    ) {
      return;
    }
    setBusyId(orderId);
    const t = await token();
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify({ orderId, action }),
    });
    const out = await res.json();
    setBusyId("");
    if (!res.ok) setError(out.error ?? "Something went wrong.");
    await load();
  }

  const q = search.trim().toLowerCase();
  const shown = orders.filter(
    (o) =>
      !q ||
      (o.email ?? "").toLowerCase().includes(q) ||
      (o.link ?? "").toLowerCase().includes(q) ||
      (o.service ?? "").toLowerCase().includes(q)
  );
  const total = shown.reduce((s, o) => s + Number(o.charge || 0), 0);

  const tab = (v: "open" | "done", label: string) => (
    <button
      onClick={() => setView(v)}
      className={`flex-1 rounded-full px-5 py-3 text-lg font-bold ${
        view === v ? "bg-[#4f46e5] text-white" : "text-slate-600"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f5f6fb] text-slate-900">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-[#f8f9fc]/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-extrabold text-white"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c6cf2)" }}
          >
            D
          </span>
          <div>
            <div className="text-xl font-extrabold leading-none">DIFFT</div>
            <div className="mt-1 flex items-center gap-1 text-xs font-semibold tracking-widest text-[#0f5c5c]">
              <ShieldCheck size={14} /> ADMIN
            </div>
          </div>
        </div>
        <Link href="/order" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-base font-semibold text-[#4f46e5] shadow-sm">
          Back to site
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-5">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-extrabold tracking-tight">Orders</h1>
          <button
            onClick={load}
            aria-label="Refresh"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-[#0f5c5c] shadow-sm"
          >
            <RefreshCw size={22} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="mt-4 flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {tab("open", "To deliver")}
          {tab("done", "Finished")}
        </div>

        <input
          className="mt-4 w-full rounded-full border border-slate-200 bg-white px-5 py-4 text-base outline-none focus:border-[#6057E8]"
          placeholder="Search by email, link or service"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-base text-slate-500">Orders shown</div>
            <div className="mt-1 text-3xl font-extrabold">{shown.length}</div>
          </div>
          <div className="rounded-3xl bg-[#e8ebff] p-4">
            <div className="text-base text-[#4f46e5]">Total charged</div>
            <div className="mt-1 text-3xl font-extrabold text-[#3b35c9]">
              KES {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {loading && <p className="mt-6 text-center text-lg text-slate-500">Loading...</p>}
        {error && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-lg text-red-700">
            {error}
          </p>
        )}
        {!loading && !error && shown.length === 0 && (
          <p className="mt-8 text-center text-lg text-slate-500">No orders here.</p>
        )}

        <div className="mt-4 space-y-4">
          {shown.map((o) => (
            <div key={o.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="text-xl font-bold leading-snug">{o.service}</div>
                <span
                  className={`shrink-0 rounded-full px-4 py-1.5 text-base font-semibold ${
                    COLOR[o.status] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {LABEL[o.status] ?? o.status}
                </span>
              </div>

              <a
                href={o.link}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-start gap-2 break-all text-base font-medium text-[#4f46e5]"
              >
                <ExternalLink size={18} className="mt-0.5 shrink-0" /> {o.link}
              </a>

              <div className="mt-3 flex justify-between text-lg">
                <span className="text-slate-600">Qty: {o.quantity}</span>
                <span className="font-bold">KES {Number(o.charge).toFixed(2)}</span>
              </div>
              <div className="mt-1 text-base text-slate-500">
                {o.email} · {new Date(o.created_at).toLocaleString()}
              </div>

              {view === "open" && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {o.status === "pending" ? (
                    <button
                      disabled={busyId === o.id}
                      onClick={() => act(o.id, "processing")}
                      className="flex items-center justify-center gap-1.5 rounded-full bg-[#4f46e5] py-3 text-base font-bold text-white disabled:opacity-50"
                    >
                      <Play size={18} /> Start
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    disabled={busyId === o.id}
                    onClick={() => act(o.id, "completed")}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-[#16a34a] py-3 text-base font-bold text-white disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} /> Complete
                  </button>
                  <button
                    disabled={busyId === o.id}
                    onClick={() => act(o.id, "cancel")}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-red-600 py-3 text-base font-bold text-white disabled:opacity-50"
                  >
                    <XCircle size={18} /> Refund
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
          }
