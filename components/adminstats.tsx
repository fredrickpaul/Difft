"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/sb";

const LOW_USD = 5; // warn when the FKM balance drops below this

const kes = (n: number | null | undefined) =>
  n == null ? "—" : `KES ${Math.round(n).toLocaleString()}`;

export default function AdminStats() {
  const [s, setS] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await getSupabase().auth.getSession();
      const token = data?.session?.access_token;
      if (!token) return;
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const out = await res.json();
      if (!res.ok) setErr(out.error ?? "Could not load stats.");
      else setS(out);
    })();
  }, []);

  if (err) return <p className="mt-4 text-base text-red-700">{err}</p>;
  if (!s) return <p className="mt-4 text-base text-slate-500">Loading stats...</p>;

  const fkm = s.fkm;
  const fkmColor = !fkm
    ? "bg-slate-100 text-slate-700"
    : fkm.balance < 1
    ? "bg-red-100 text-red-800"
    : fkm.balance < LOW_USD
    ? "bg-amber-100 text-amber-800"
    : "bg-green-100 text-green-800";

  const card = (label: string, value: string, sub?: string, tone = "bg-white border border-slate-200") => (
    <div className={`rounded-3xl p-4 ${tone}`}>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
      {sub && <div className="mt-0.5 text-sm text-slate-500">{sub}</div>}
    </div>
  );

  const by = s.orders?.byStatus ?? {};

  return (
    <section className="mt-4 space-y-3">
      <div className={`rounded-3xl p-4 ${fkmColor}`}>
        <div className="text-sm font-semibold">FKM balance</div>
        <div className="mt-1 text-3xl font-extrabold">
          {fkm ? `${fkm.currency === "USD" ? "$" : ""}${fkm.balance.toFixed(2)} ${fkm.currency === "USD" ? "" : fkm.currency}` : "Could not load"}
        </div>
        {fkm && fkm.balance < LOW_USD && (
          <div className="mt-1 text-sm font-semibold">
            Low balance. Top up FKM or customer orders will fail.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {card("Users", s.users ? String(s.users.total) : "—", s.users ? `+${s.users.today} today, +${s.users.week} this week` : undefined)}
        {card("Customer wallets", kes(s.walletsTotal), "Held by customers")}
        {card("Deposits today", kes(s.deposits?.today), `${kes(s.deposits?.week)} this week`)}
        {card("Sales today", kes(s.orders?.salesToday), s.orders ? `${s.orders.ordersToday} orders` : undefined)}
        {card("Deposits total", kes(s.deposits?.all))}
        {card(
          "Stuck over 24h",
          s.orders ? String(s.orders.stuck) : "—",
          "Open orders waiting",
          s.orders?.stuck > 0 ? "bg-amber-100" : "bg-white border border-slate-200"
        )}
      </div>

      {s.orders && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Orders by status ({s.orders.total} total)</div>
          <div className="mt-2 flex flex-wrap gap-2 text-sm font-semibold">
            {Object.entries(by).map(([k, v]) => (
              <span key={k} className="rounded-full bg-slate-100 px-3 py-1">
                {k.replace("_", " ")}: {String(v)}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
