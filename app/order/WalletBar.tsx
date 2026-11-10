"use client";

import { useEffect, useState } from "react";
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

export default function WalletBar() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loggedIn, setLoggedIn] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await getSupabase().auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {
        setLoggedIn(false);
        return;
      }
      const res = await fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const out = await res.json();
      setBalance(Number(out.balance ?? 0));
    })();
  }, []);

  if (!loggedIn) {
    return (
      <Link
        href="/login"
        className="block rounded-xl bg-[#6057E8] p-3 text-center font-semibold text-white"
      >
        Log in to see your wallet
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border bg-white p-3">
      <div>
        <div className="text-xs text-gray-500">Wallet balance</div>
        <div className="text-lg font-bold text-[#203C43]">
          KES {balance === null ? "..." : balance.toFixed(2)}
        </div>
      </div>
      <Link
        href="/add-funds"
        className="rounded-lg bg-[#20C765] px-3 py-2 text-sm font-semibold text-white"
      >
        + Add
      </Link>
    </div>
  );
}
