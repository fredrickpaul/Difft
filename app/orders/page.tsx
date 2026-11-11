"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Order = {
  id: string;
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

const LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  in_progress: "In progress",
  completed: "Completed",
  partial: "Partial",
  canceled: "Canceled",
};

const COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  partial: "bg-orange-100 text-orange-800",
  canceled: "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <main className="mx-auto max-w-md space-y-3 bg-gray-50 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#203C43]">My Orders</h1>
        <Link href="/order" className="text-sm text-[#6057E8]">
          + New order
        </Link>
      </div>

      {loading && <p className="text-sm text-[#203C43]">Loading...</p>}

      {error && (
        <div className="space-y-2">
          <p className="text-sm text-[#203C43]">{error}</p>
          <Link href="/login" className="text-sm text-[#6057E8]">
            Go to login
          </Link>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <p className="text-sm text-[#203C43]">
          You have no orders yet. Place your first one from the order page.
        </p>
      )}

      {orders.map((o) => (
        <div key={o.id} className="space-y-1 rounded-xl border bg-white p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold text-[#203C43]">{o.service}</div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                COLOR[o.status] ?? "bg-gray-100 text-gray-800"
              }`}
            >
              {LABEL[o.status] ?? o.status}
            </span>
          </div>
          <div className="break-all text-xs text-gray-500">{o.link}</div>
          <div className="flex justify-between text-sm text-[#203C43]">
            <span>Qty: {o.quantity}</span>
            <span>KES {o.charge.toFixed(2)}</span>
          </div>
          <div className="text-xs text-gray-400">
            {new Date(o.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </main>
  );
}
