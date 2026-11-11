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

const PLATFORMS = [
  "TikTok",
  "Instagram",
  "Facebook",
  "YouTube",
  "Twitter",
  "Telegram",
];

const STEPS = [
  { n: "1", title: "Add funds", text: "Top up your wallet with M-Pesa." },
  { n: "2", title: "Pick a service", text: "Choose the platform, service and quantity." },
  { n: "3", title: "Track your order", text: "Follow every order from your My Orders page." },
];

export default function Home() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => setLoggedIn(!!data?.session));
  }, []);

  async function logout() {
    await getSupabase().auth.signOut();
    setLoggedIn(false);
  }

  return (
    <main className="mx-auto max-w-md bg-gray-50 pb-16">
      <header className="flex items-center justify-between p-4">
        <span className="text-2xl font-extrabold text-[#203C43]">Difft</span>
        {loggedIn ? (
          <button onClick={logout} className="text-sm text-[#6057E8]">
            Log out
          </button>
        ) : (
          <Link href="/login" className="text-sm font-semibold text-[#6057E8]">
            Log in
          </Link>
        )}
      </header>

      <section className="space-y-4 rounded-b-3xl bg-[#203C43] p-6 text-white">
        <h1 className="text-3xl font-bold leading-tight">
          Buy followers, likes and views.
        </h1>
        <p className="text-lg opacity-90">Pay with M-Pesa.</p>

        <div className="space-y-3 pt-2">
          <Link
            href="/order"
            className="block rounded-xl bg-[#20C765] p-3 text-center font-semibold text-white"
          >
            Start ordering
          </Link>

          {loggedIn ? (
            <div className="flex gap-3">
              <Link
                href="/orders"
                className="flex-1 rounded-xl bg-white/10 p-3 text-center font-semibold text-white"
              >
                My Orders
              </Link>
              <Link
                href="/add-funds"
                className="flex-1 rounded-xl bg-[#6057E8] p-3 text-center font-semibold text-white"
              >
                Add Funds
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="block rounded-xl bg-[#6057E8] p-3 text-center font-semibold text-white"
            >
              Log in or sign up
            </Link>
          )}
        </div>
      </section>

      <section className="space-y-3 p-4 pt-6">
        <h2 className="text-lg font-bold text-[#203C43]">Platforms</h2>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <span
              key={p}
              className="rounded-full border bg-white px-3 py-1 text-sm text-[#203C43]"
            >
              {p}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-3 p-4">
        <h2 className="text-lg font-bold text-[#203C43]">How it works</h2>
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="flex items-start gap-3 rounded-xl border bg-white p-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6057E8] font-bold text-white">
              {s.n}
            </div>
            <div>
              <div className="font-semibold text-[#203C43]">{s.title}</div>
              <div className="text-sm text-gray-600">{s.text}</div>
            </div>
          </div>
        ))}
      </section>

      <footer className="p-4 text-center text-xs text-gray-400">
        Difft &copy; 2026
      </footer>
    </main>
  );
              }
