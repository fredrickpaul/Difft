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

export default function ImportPage() {
  const [markup, setMarkup] = useState("40");
  const [rate, setRate] = useState("129");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    if (
      !window.confirm(
        "Import the provider's services? Prices of services imported before will be recalculated."
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg("Importing... this can take a minute.");
    const { data } = await getSupabase().auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      setBusy(false);
      setMsg("Please log in first at /login.");
      return;
    }
    const res = await fetch("/api/admin/import-services", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ markupPercent: markup, usdToKes: rate }),
    });
    const out = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(`${out.error ?? "Import failed."} ${out.detail ?? ""}`);
      return;
    }
    setMsg(`Done. ${out.imported} services imported, ${out.skipped} skipped.`);
  }

  const box =
    "w-full rounded-xl border border-gray-300 bg-white p-3 text-[#203C43]";

  return (
    <main className="mx-auto max-w-md space-y-4 bg-gray-50 p-4">
      <h1 className="text-2xl font-bold text-[#203C43]">Import services</h1>
      <p className="text-sm text-[#203C43]">
        Your price = provider cost in USD x rate x (1 + markup).
      </p>

      <label className="block text-sm text-[#203C43]">
        Markup (%)
        <input
          className={box}
          type="number"
          value={markup}
          onChange={(e) => setMarkup(e.target.value)}
        />
      </label>
      <label className="block text-sm text-[#203C43]">
        KES per 1 USD
        <input
          className={box}
          type="number"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
        />
      </label>

      <button
        onClick={run}
        disabled={busy}
        className="w-full rounded-xl bg-[#6057E8] p-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Importing..." : "Import services"}
      </button>

      {msg && <p className="text-sm text-[#203C43]">{msg}</p>}

      <Link href="/admin" className="block text-center text-[#6057E8]">
        Back to admin
      </Link>
    </main>
  );
}
