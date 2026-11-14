"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Search, Plus } from "lucide-react";
import AppShell from "@/components/appshell";
import { getSupabase } from "@/lib/sb";

type Order = {
  id: string;
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
};

const COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  partial: "bg-orange-100 text-orange-800",
  canceled: "bg-red-100 text-red-800",
};

const TABS: { key: string; label: string; match: string[] }[] = [
  { key: "all", label: "All", match: [] },
  { key: "pending", label: "Pending", match: ["pending"] },
  { key: "progress", label: "In progress", match: ["processing", "in_progress"] },
  { key: "completed", label: "Completed", match: ["completed"] },
  { key: "partial", label: "Partial", match: ["partial"] },
  { key: "canceled", label: "Canceled", match: ["canceled"] },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await getSupabase().auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {
        setError("Please log in to see your orders.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/my-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const out = await res.json();
      if (!res.ok) setError(out.error ?? "Could not load your orders.");
      else setOrders(out.orders ?? []);
      setLoading(false);
    })();
  }, []);

  const active = TABS.find((t) => t.key === tab)!;
  const q = search.trim().toLowerCase();
  const shown = orders
    .filter((o) => tab === "all" || active.match.includes(o.status))
    .filter(
      (o) =>
        !q ||
        String(o.id).toLowerCase().includes(q) ||
        (o.link ?? "").toLowerCase().includes(q) ||
        (o.service ?? "").toLowerCase().includes(q)
    );

  return (
    <AppShell>
      <h1 className="mb-5 text-4xl font-extrabold tracking-tight">My Orders</h1>

      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        <div className="p-4">
          <div className="flex gap-3 overflow-x-auto pb-3">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 rounded-full px-6 py-3 text-lg font-bold ${
                  tab === t.key ? "bg-[#4f46e5] text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative mt-2">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full rounded-full border border-slate-200 bg-white py-4 pl-12 pr-4 text-lg outline-none focus:border-[#6057E8]"
              placeholder="Search by order ID or link"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="border-t border-slate-200">
          {loading && <p className="p-8 text-center text-lg text-slate-500">Loading...</p>}

          {error && (
            <div className="space-y-3 p-8 text-center">
              <p className="text-lg text-slate-700">{error}</p>
              <Link href="/login" className="text-lg font-semibold text-[#4f46e5]">
                Go to login
              </Link>
            </div>
          )}

          {!loading && !error && shown.length === 0 && (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <span className="flex h-24 w-24 items-center justify-center rounded-[30px] bg-[#d9f2f1] text-[#0f5c5c]">
                <ClipboardList size={40} />
              </span>
              <div className="mt-5 text-3xl font-extrabold">
                {orders.length === 0 ? "No orders yet" : "No matching orders"}
              </div>
              <p className="mt-2 text-lg text-slate-500">
                {orders.length === 0
                  ? "When you place an order, you'll be able to follow its progress here."
                  : "Try a different tab or search."}
              </p>
              {orders.length === 0 && (
                <Link
                  href="/order"
                  className="mt-6 flex items-center gap-2 rounded-full px-8 py-4 text-xl font-bold text-white shadow-lg"
                  style={{ background: "linear-gradient(90deg,#4f46e5,#7c6cf2)" }}
                >
                  <Plus size={22} /> Place a new order
                </Link>
              )}
            </div>
          )}

          {shown.map((o) => (
            <div key={o.id} className="space-y-2 border-b border-slate-200 p-5 last:border-0">
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
              <div className="break-all text-base text-slate-500">{o.link}</div>
              <div className="flex justify-between text-lg">
                <span className="text-slate-600">Qty: {o.quantity}</span>
                <span className="font-bold">KES {Number(o.charge).toFixed(2)}</span>
              </div>
              <div className="text-base text-slate-400">
                {new Date(o.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
              }
