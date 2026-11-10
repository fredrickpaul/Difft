"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

export default function AddFundsPage() {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

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
        return;
      }
      if (dep?.status === "failed") {
        setBusy(false);
        setMsg("The payment was cancelled or failed. You can try again.");
        return;
      }
    }
    setBusy(false);
    setMsg("Still waiting. If you paid, your balance will update shortly.");
  }

  const box =
    "w-full rounded-xl border border-gray-300 bg-white p-3 text-[#203C43]";

  return (
    <main className="mx-auto max-w-md space-y-4 bg-gray-50 p-4">
      <h1 className="text-2xl font-bold text-[#203C43]">Add Funds</h1>
      <p className="text-sm text-[#203C43]">
        Pay with M-Pesa. You will get a prompt on your phone.
      </p>

      <input
        className={box}
        type="tel"
        placeholder="M-Pesa number, e.g. 0712345678"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        className={box}
        type="number"
        min={1}
        placeholder="Amount in KES"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        onClick={pay}
        disabled={busy || !phone || !amount}
        className="w-full rounded-xl bg-[#20C765] p-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Waiting for payment..." : "Pay with M-Pesa"}
      </button>

      {msg && <p className="text-sm text-[#203C43]">{msg}</p>}

      <Link href="/order" className="block text-center text-[#6057E8]">
        Back to orders
      </Link>
    </main>
  );
}
