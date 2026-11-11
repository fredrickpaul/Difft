"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Service = {
  id: number;
  platform: string;
  name: string;
  price_per_1000: number;
  min_qty: number;
  max_qty: number;
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

const CHIPS = [
  "Everything", "Instagram", "Facebook", "YouTube", "Twitter",
  "Spotify", "TikTok", "LinkedIn", "Telegram", "Website", "Other",
];

export default function OrderPage() {
  const [all, setAll] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("Everything");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1000);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setAll(d.services ?? []))
      .finally(() => setLoading(false));
  }, []);

  const inPlatform = useMemo(
    () =>
      all
        .filter((s) => platform === "Everything" || s.platform === platform)
        .filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [all, platform, search]
  );

  const categories = useMemo(
    () => Array.from(new Set(inPlatform.map((s) => s.name.split(" | ")[0]))),
    [inPlatform]
  );

  const services = inPlatform.filter(
    (s) => !category || s.name.split(" | ")[0] === category
  );

  const selected = all.find((s) => s.id === serviceId) ?? null;
  const total = selected
    ? ((selected.price_per_1000 * quantity) / 1000).toFixed(2)
    : "0.00";

  async function submit() {
    setMsg("");
    if (!selected) return setMsg("Pick a service first.");
    if (!link.trim()) return setMsg("Add the link to your profile or post.");
    if (
      !Number.isInteger(quantity) ||
      quantity < selected.min_qty ||
      quantity > selected.max_qty
    ) {
      return setMsg(
        `Quantity must be between ${selected.min_qty} and ${selected.max_qty}.`
      );
    }

    setBusy(true);
    const { data } = await getSupabase().auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      setBusy(false);
      return setMsg("Please log in first at /login.");
    }

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ serviceId: selected.id, link: link.trim(), quantity }),
    });
    const out = await res.json();
    setBusy(false);

    if (!res.ok) return setMsg(out.error ?? "Could not place the order.");
    setMsg(
      `Order placed. KES ${Number(out.charge).toFixed(2)} was taken from your wallet. Reload the page to see your new balance.`
    );
    setLink("");
  }

  const box =
    "w-full rounded-xl border border-gray-300 bg-white p-3 text-[#203C43]";

  return (
    <main className="mx-auto max-w-md space-y-4 bg-gray-50 p-4 pb-24">
      <h1 className="text-2xl font-bold text-[#203C43]">New Order</h1>

      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => {
              setPlatform(c);
              setCategory("");
              setServiceId(null);
            }}
            className={`rounded-full px-3 py-1 text-sm ${
              platform === c
                ? "bg-[#6057E8] text-white"
                : "border bg-white text-[#203C43]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <input
        className={box}
        placeholder="Search services..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select
        className={box}
        value={category}
        onChange={(e) => {
          setCategory(e.target.value);
          setServiceId(null);
        }}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        className={box}
        value={serviceId ?? ""}
        onChange={(e) =>
          setServiceId(e.target.value ? Number(e.target.value) : null)
        }
      >
        <option value="">
          {loading
            ? "Loading services..."
            : services.length
            ? "Select a service"
            : "No services for this platform yet"}
        </option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.platform} {s.name} - KES {s.price_per_1000}/1000
          </option>
        ))}
      </select>

      <input
        className={box}
        placeholder="Link (profile or post URL)"
        value={link}
        onChange={(e) => setLink(e.target.value)}
      />

      <input
        className={box}
        type="number"
        min={1}
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
      />
      {selected && (
        <p className="text-xs text-gray-500">
          Min {selected.min_qty} / Max {selected.max_qty}
        </p>
      )}

      <div className="rounded-xl bg-[#203C43] p-4 text-white">
        <div className="text-sm opacity-80">
          Price per 1000: KES {selected ? selected.price_per_1000 : 0}
        </div>
        <div className="text-xl font-bold">Total: KES {total}</div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={submit}
          disabled={busy}
          className="flex-1 rounded-xl bg-[#20C765] p-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Placing order..." : "Submit Order"}
        </button>
        <Link
          href="/add-funds"
          className="flex-1 rounded-xl bg-[#6057E8] p-3 text-center font-semibold text-white"
        >
          Add Funds
        </Link>
      </div>

      {msg && <p className="text-sm text-[#203C43]">{msg}</p>}
    </main>
  );
    }
