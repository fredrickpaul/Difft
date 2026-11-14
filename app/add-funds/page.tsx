"use client";

import { useEffect, useState } from "react";
import { Smartphone, Wallet } from "lucide-react";
import AppShell from "@/components/appshell";
import { getSupabase } from "@/lib/sb";

type Deposit = { id: string | number; status?: string; amount?: number; created_at?: string };

const QUICK = [100, 500, 1000, 2500, 5000];

export default function AddFundsPage() {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [deposits, setDeposits] = useState<Deposit[]>([]);

  async function loadDeposits() {
    const { data } = await getSupabase().from("deposits").select("*");
    if (!data) return;
    const sorted = [...data].sort((a: any, b: any) =>
      String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
    );
    setDeposits(sorted.slice(0, 5) as Deposit[]);
  }

  useEffect(() => {
    loadDeposits();
  }, []);

  async function pay() {
    setMsg("");
    setBusy(true);
    const supabase = getSupabase();

    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      setBusy(false);
      setMsg("Please log in first at /login.");
      return;
    }

    const res = await fetch("/api/mpesa/stkpush", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ phone, amount: Number(amount) }),
    });
    const out = await res.json();
    if (!res.ok) {
      setBusy(false);
      setMsg(out.error ?? "Could not start the payment.");
      return;
    }

    setMsg("Check your phone and enter your M-Pesa PIN.");

    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const { data: dep } = await supabase
        .from("deposits")
        .select("status")
        .eq("id", out.depositId)
        .single();
      if (dep?.status === "success") {
        setBusy(false);
        setMsg("Payment received. Your wallet has been topped up.");
        loadDeposits();
        return;
      }
      if (dep?.status === "failed") {
        setBusy(false);
        setMsg("The payment was cancelled or failed. You can try again.");
        loadDeposits();
        return;
      }
    }
    setBusy(false);
    setMsg("Still waiting. If you paid, your balance will update shortly.");
  }

  const input =
    "w-full rounded-full border border-slate-200 bg-white px-5 py-4 text-lg outline-none focus:border-[#6057E8]";
  const adding = Number(amount) > 0 ? `KES ${Number(amount).toLocaleString()}` : "—";

  const badge = (s?: string) =>
    s === "success"
      ? "bg-green-100 text-green-700"
      : s === "failed"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-700";

  return (
    <AppShell>
      <h1 className="mb-5 text-4xl font-extrabold tracking-tight">Add Funds</h1>

      <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <label className="mb-2 block text-lg font-medium">M-Pesa phone number</label>
        <input
          className={input}
          type="tel"
          placeholder="07XX XXX XXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <p className="mt-2 text-base text-slate-500">
          You'll get a prompt on this phone to enter your M-Pesa PIN.
        </p>

        <label className="mb-2 mt-6 block text-lg font-medium">Amount (KES)</label>
        <input
          className={`${input} text-2xl font-bold`}
          type="number"
          min={1}
          placeholder="e.g. 1000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <div className="mt-4 flex flex-wrap gap-3">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(String(q))}
              className={`rounded-full border px-5 py-3 text-lg font-semibold ${
                amount === String(q) ? "border-[#6057E8] bg-[#e8ebff] text-[#3b35c9]" : "border-slate-200 bg-white"
              }`}
            >
              KES {q.toLocaleString()}
            </button>
          ))}
        </div>

        <button
          onClick={pay}
          disabled={busy || !phone || !amount}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-[#16a34a] py-4 text-xl font-bold text-white shadow-lg disabled:opacity-50"
        >
          <Smartphone size={22} /> {busy ? "Waiting for payment..." : "Pay with M-Pesa"}
        </button>

        {msg && <p className="mt-4 text-lg text-slate-700">{msg}</p>}
      </section>

      <section
        className="mt-5 rounded-[32px] p-6 text-white shadow-xl"
        style={{ background: "linear-gradient(135deg,#3b35c9,#6057e8 55%,#8b5cdc)" }}
      >
        <div className="text-base font-medium tracking-wider text-white/80">TOP-UP AMOUNT</div>
        <div className="mt-2 text-5xl font-extrabold">{adding}</div>
        <div className="mt-5 border-t border-white/25 pt-4 text-lg text-white/85">
          Added to your DIFFT wallet after payment
        </div>
      </section>

      <section className="mt-5 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-extrabold">How it works</h2>
        {[
          "Enter your M-Pesa phone number and amount.",
          "Approve the prompt on your phone with your M-Pesa PIN.",
          "Your DIFFT wallet is topped up automatically.",
        ].map((t, i) => (
          <div key={i} className="mt-4 flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d9f2f1] font-bold text-[#0f5c5c]">
              {i + 1}
            </span>
            <p className="pt-1 text-lg text-slate-600">{t}</p>
          </div>
        ))}
      </section>

      <section className="mt-5 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-extrabold">Recent deposits</h2>
        {deposits.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#d9f2f1] text-[#0f5c5c]">
              <Wallet size={34} />
            </span>
            <div className="mt-4 text-2xl font-bold">No deposits yet</div>
            <div className="text-lg text-slate-500">Your top-ups will show here.</div>
          </div>
        ) : (
          <div className="mt-3 divide-y divide-slate-200">
            {deposits.map((d) => (
              <div key={String(d.id)} className="flex items-center justify-between py-4">
                <div>
                  <div className="text-xl font-bold">
                    {d.amount != null ? `KES ${Number(d.amount).toLocaleString()}` : "Deposit"}
                  </div>
                  <div className="text-base text-slate-500">
                    {d.created_at ? new Date(d.created_at).toLocaleString() : ""}
                  </div>
                </div>
                <span className={`rounded-full px-4 py-1.5 text-base font-semibold capitalize ${badge(d.status)}`}>
                  {d.status ?? "pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
                }
