"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Instagram, Facebook, Youtube, Twitter, Linkedin, Send, Globe, Music,
  Music2, LayoutGrid, Sparkles, Zap, ShieldCheck, Search, ChevronDown,
  ArrowRight, Star, SendHorizontal, Plus,
} from "lucide-react";
import AppShell from "@/components/appshell";
import { getSupabase } from "@/lib/sb";

type Service = {
  id: number;
  platform: string;
  category?: string;
  name: string;
  price_per_1000: number;
  min_qty: number;
  max_qty: number;
};

const PLATFORMS = [
  { key: "Instagram", sub: "Followers, likes, reels", color: "#e1306c", Icon: Instagram },
  { key: "Facebook", sub: "Page likes, followers", color: "#1d6fe0", Icon: Facebook },
  { key: "YouTube", sub: "Views, subscribers", color: "#e50914", Icon: Youtube },
  { key: "TikTok", sub: "Views, followers, likes", color: "#111827", Icon: Music2 },
  { key: "Twitter", sub: "Followers, reposts", color: "#111111", Icon: Twitter },
  { key: "Spotify", sub: "Plays, monthly listeners", color: "#16a34a", Icon: Music },
  { key: "LinkedIn", sub: "Connections, post likes", color: "#0a66c2", Icon: Linkedin },
  { key: "Telegram", sub: "Members, post views", color: "#0ea5e9", Icon: Send },
  { key: "Website", sub: "Targeted traffic", color: "#0f5c5c", Icon: Globe },
  { key: "Other", sub: "More platforms", color: "#4f46e5", Icon: LayoutGrid },
];

const POPULAR = ["Instagram", "TikTok", "YouTube", "Facebook", "Telegram"];

function samePlatform(sp: string, key: string) {
  const norm = (v: string) => (v ?? "").toLowerCase().replace(/[^a-z]/g, "");
  const a = norm(sp);
  const b = norm(key);
  if (b === "twitter") return ["twitter", "x", "twitterx"].includes(a);
  return a === b;
}

function catOf(s: Service) {
  return s.category || s.name.split(" | ")[0];
}

export default function OrderPage() {
  const [all, setAll] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState("");
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
        .filter((s) => !platform || samePlatform(s.platform, platform))
        .filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    [all, platform, search]
  );

  const categories = useMemo(
    () => Array.from(new Set(inPlatform.map((s) => catOf(s)))),
    [inPlatform]
  );

  const services = inPlatform.filter((s) => !category || catOf(s) === category);

  const selected = all.find((s) => s.id === serviceId) ?? null;
  const total = selected
    ? ((selected.price_per_1000 * quantity) / 1000).toFixed(2)
    : "0.00";

  const popular = POPULAR.map((p) =>
    all.find((s) => samePlatform(s.platform, p))
  ).filter(Boolean) as Service[];

  function goToForm() {
    setTimeout(
      () =>
        document
          .getElementById("order-form")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50
    );
  }

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
      `Order placed. KES ${Number(out.charge).toFixed(2)} was taken from your wallet.`
    );
    setLink("");
  }

  const input =
    "w-full rounded-full border border-slate-200 bg-white px-5 py-4 text-base text-slate-900 outline-none focus:border-[#6057E8]";
  const label = "mb-2 mt-5 block text-lg font-medium";

  return (
    <AppShell>
      <h1 className="mb-5 text-4xl font-extrabold tracking-tight">New Order</h1>

      <section
        className="rounded-[32px] p-6 text-white shadow-xl"
        style={{ background: "linear-gradient(135deg,#3b35c9,#6057e8 55%,#8b5cdc)" }}
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-base font-semibold">
          <Sparkles size={20} /> Welcome to DIFFT
        </div>
        <h2 className="mt-5 text-4xl font-extrabold leading-tight">
          Grow every channel from one dashboard.
        </h2>
        <p className="mt-3 text-lg text-white/85">
          Choose a platform, pick a service and see your total before you order.
        </p>
        <div className="mt-6 flex gap-6 text-base text-white/90">
          <span className="flex items-center gap-2"><Zap size={20} /> Fast start</span>
          <span className="flex items-center gap-2"><ShieldCheck size={20} /> Refill options</span>
        </div>
      </section>

      <p className="mt-9 text-base font-bold tracking-[0.2em] text-[#4f46e5]">STEP 1</p>
      <h2 className="mb-4 text-3xl font-extrabold">Choose a platform</h2>
      <div className="grid grid-cols-2 gap-3">
        {PLATFORMS.map(({ key, sub, color, Icon }) => (
          <button
            key={key}
            onClick={() => {
              setPlatform(platform === key ? "" : key);
              setCategory("");
              setServiceId(null);
              goToForm();
            }}
            className={`flex items-center gap-3 rounded-[26px] border bg-white p-3.5 text-left shadow-sm ${
              platform === key ? "border-[#6057E8] ring-2 ring-[#6057E8]/30" : "border-slate-200"
            }`}
          >
            <span
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ background: color }}
            >
              <Icon size={26} />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-bold">{key === "Twitter" ? "Twitter / X" : key}</span>
              <span className="block truncate text-sm text-slate-500">{sub}</span>
            </span>
          </button>
        ))}
      </div>

      <p id="order-form" className="mt-9 text-base font-bold tracking-[0.2em] text-[#4f46e5]">STEP 2</p>
      <h2 className="mb-4 text-3xl font-extrabold">New order</h2>
      <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="relative">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full rounded-full border border-slate-200 bg-slate-100 py-4 pl-12 pr-4 text-base outline-none"
            placeholder="Search services, e.g. TikTok views"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <label className={label}>Category</label>
        <div className="relative">
          <select
            className={`${input} appearance-none`}
            value={category}
            onChange={(e) => { setCategory(e.target.value); setServiceId(null); }}
          >
            <option value="">Choose a category</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown size={20} className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        <label className={label}>Service</label>
        <div className="relative">
          <select
            className={`${input} appearance-none`}
            value={serviceId ?? ""}
            onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">
              {loading ? "Loading services..." : services.length ? "Select a service" : "No services for this platform yet"}
            </option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} - KES {s.price_per_1000}/1000
              </option>
            ))}
          </select>
          <ChevronDown size={20} className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        <label className={label}>Target URL</label>
        <input
          className={input}
          placeholder="https://instagram.com/yourprofile"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />

        <label className={label}>Quantity</label>
        <input
          className={input}
          type="number"
          min={1}
          placeholder="e.g. 1000"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        <p className="mt-2 text-base text-slate-500">
          {selected ? `Min ${selected.min_qty} / Max ${selected.max_qty}` : "Pick a service to see limits"}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-slate-200 p-4">
            <div className="text-base text-slate-500">Price per 1,000</div>
            <div className="mt-2 text-2xl font-extrabold">
              {selected ? `KES ${selected.price_per_1000}` : "—"}
            </div>
          </div>
          <div className="rounded-3xl bg-[#e8ebff] p-4">
            <div className="text-base text-[#4f46e5]">Total charge</div>
            <div className="mt-2 text-2xl font-extrabold text-[#3b35c9]">KES {total}</div>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={busy}
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-full py-4 text-xl font-bold text-white shadow-lg disabled:opacity-50"
          style={{ background: "linear-gradient(90deg,#4f46e5,#7c6cf2)" }}
        >
          <SendHorizontal size={22} /> {busy ? "Placing order..." : "Submit Order"}
        </button>
        <Link
          href="/add-funds"
          className="mt-3 flex w-full items-center justify-center gap-3 rounded-full bg-[#16a34a] py-4 text-xl font-bold text-white"
        >
          <Plus size={22} /> Add Funds
        </Link>
        {msg && <p className="mt-4 text-base text-slate-700">{msg}</p>}
      </section>

      <div className="mt-9 flex items-end justify-between">
        <div>
          <p className="text-base font-bold tracking-[0.2em] text-[#4f46e5]">POPULAR</p>
          <h2 className="text-3xl font-extrabold">Frequently ordered</h2>
        </div>
        <Link href="/orders" className="pb-1 text-lg font-semibold text-[#4f46e5]">My orders</Link>
      </div>
      <div className="mt-4 space-y-4">
        {popular.map((s, i) => {
          const p = PLATFORMS.find((x) => samePlatform(s.platform, x.key));
          const Icon = p?.Icon ?? LayoutGrid;
          return (
            <div key={s.id} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-full text-white"
                  style={{ background: p?.color ?? "#4f46e5" }}
                >
                  <Icon size={26} />
                </span>
                {i < 2 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-[#fdf0d5] px-3 py-1.5 text-sm font-semibold text-[#92400e]">
                    <Star size={16} className="fill-[#f59e0b] text-[#f59e0b]" /> Best seller
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm text-slate-500">{p?.key ?? s.platform} · ID {s.id}</p>
              <p className="mt-1 text-xl font-bold leading-snug">{s.name}</p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-3xl font-extrabold">KES {s.price_per_1000}</div>
                  <div className="text-base text-slate-500">per 1,000</div>
                </div>
                <button
                  onClick={() => {
                    setPlatform(p?.key ?? "");
                    setCategory("");
                    setServiceId(s.id);
                    goToForm();
                  }}
                  className="flex items-center gap-2 rounded-full bg-[#e8ebff] px-5 py-3 text-lg font-semibold text-[#3b35c9]"
                >
                  Order <ArrowRight size={20} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
