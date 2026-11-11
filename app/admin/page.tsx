"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

let client: SupabaseClient | null = null;
function getSupabase() {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!
    );
  }
  return client;
}

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

  const tab = (v: "open" | "done", label: string) => (
    <button
      onClick={() => setView(v)}
      className={`flex-1 rounded-xl p-2 text-sm font-semibold ${
        view === v ? "bg-[#6057E8] text-white" : "border bg-white text-[#203C43]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="mx-auto max-w-md space-y-3 bg-gray-50 p-4 pb-24">
      <h1 className="text-2xl font-bold text-[#203C43]">Admin: Orders</h1>

      <div className="flex gap-2">
        {tab("open", "To deliver")}
        {tab("done", "Finished")}
      </div>

      {loading && <p className="text-sm text-[#203C43]">Loading...</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <p className="text-sm text-[#203C43]">No orders here.</p>
      )}

      {orders.map((o) => (
        <div key={o.id} className="space-y-2 rounded-xl border bg-white p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold text-[#203C43]">{o.service}</div>
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
              {o.status}
            </span>
          </div>
          <a
            href={o.link}
            target="_blank"
            rel="noreferrer"
            className="block break-all text-xs text-[#6057E8]"
          >
            {o.link}
          </a>
          <div className="flex justify-between text-sm text-[#203C43]">
            <span>Qty: {o.quantity}</span>
            <span>KES {o.charge.toFixed(2)}</span>
          </div>
          <div className="text-xs text-gray-500">
            {o.email} · {new Date(o.created_at).toLocaleString()}
          </div>

          {view === "open" && (
            <div className="flex gap-2">
              {o.status === "pending" && (
                <button
                  disabled={busyId === o.id}
                  onClick={() => act(o.id, "processing")}
                  className="flex-1 rounded-lg bg-blue-600 p-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Start
                </button>
              )}
              <button
                disabled={busyId === o.id}
                onClick={() => act(o.id, "completed")}
                className="flex-1 rounded-lg bg-[#20C765] p-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Complete
              </button>
              <button
                disabled={busyId === o.id}
                onClick={() => act(o.id, "cancel")}
                className="flex-1 rounded-lg bg-red-600 p-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Cancel + refund
              </button>
            </div>
          )}
        </div>
      ))}
    </main>
  );
}
