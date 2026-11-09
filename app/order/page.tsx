"use client";
import { useState } from "react";

const PLATFORMS = ["Everything", "Instagram", "Facebook", "YouTube", "Twitter", "Spotify", "TikTok", "LinkedIn", "Telegram", "Website", "Other"];

const SERVICES = [
  { id: 1, platform: "TikTok", name: "TikTok Followers", per1k: 200 },
  { id: 2, platform: "TikTok", name: "TikTok Likes", per1k: 50 },
  { id: 3, platform: "TikTok", name: "TikTok Views", per1k: 30 },
  { id: 4, platform: "Instagram", name: "Instagram Followers", per1k: 200 },
  { id: 5, platform: "Instagram", name: "Instagram Likes", per1k: 50 },
  { id: 6, platform: "Facebook", name: "Facebook Post Likes", per1k: 50 },
  { id: 7, platform: "YouTube", name: "YouTube Views", per1k: 150 },
  { id: 8, platform: "Facebook", name: "Facebook Followers", per1k:200},
  { id: 9, platform: "Facebook", name:"Facebook comments", per1k:200}, 
  { id: 10,platform: "Facebook", name:"Facebook page like", per1k 100},];

const field = "mt-1 min-h-12 w-full rounded-2xl border-2 border-slate-200 px-3 text-base font-normal text-ink";

export default function OrderPage() {
  const [platform, setPlatform] = useState("Everything");
  const [serviceId, setServiceId] = useState("");
  const [link, setLink] = useState("");
  const [qty, setQty] = useState("");

  const list = platform === "Everything" ? SERVICES : SERVICES.filter((s) => s.platform === platform);
  const service = SERVICES.find((s) => String(s.id) === serviceId);
  const total = service ? Math.round((Number(qty) || 0) * service.per1k) / 1000 : 0;

  return (
    <main className="mx-auto max-w-md space-y-4 p-5">
      <h1 className="text-2xl font-bold">New order</h1>
      <div className="grid grid-cols-2 gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p}
            onClick={() => { setPlatform(p); setServiceId(""); }}
            className={`min-h-12 rounded-2xl px-3 text-left font-semibold ${platform === p ? "bg-ink text-white" : "bg-white"}`}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="space-y-4 rounded-3xl bg-white p-5">
        <label className="block text-sm font-bold opacity-70">
          Service
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={`${field} bg-slate-100`}>
            <option value="">-- Select Service --</option>
            {list.map((s) => (
              <option key={s.id} value={s.id}>{s.name} (KES {s.per1k}/1K)</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-bold opacity-70">
          Link
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className={field} />
        </label>
        <label className="block text-sm font-bold opacity-70">
          Quantity
          <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" placeholder="100" className={field} />
        </label>
        <div className="space-y-2 rounded-2xl bg-slate-100 p-4">
          <div className="flex justify-between"><span>Price / 1000</span><b>KES {service ? service.per1k : 0}</b></div>
          <div className="flex justify-between"><span>Total Charge</span><b>KES {total}</b></div>
        </div>
        <div className="flex gap-3">
          <button className="min-h-13 flex-1 rounded-2xl bg-brand font-bold text-white">Submit Order</button>
          <button className="min-h-13 flex-1 rounded-2xl bg-go font-bold text-ink">Add Funds</button>
        </div>
      </div>
    </main>
  );
      }
