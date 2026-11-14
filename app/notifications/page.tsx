"use client";
import { useState } from "react";
import { Sparkles, Megaphone, Gift, ShieldCheck, Trash2, CheckCheck } from "lucide-react";
import AppShell from "@/components/appshell";

const initial = [
  { id: 1, icon: Sparkles, title: "Welcome to DIFFT", body: "Your dashboard is ready. Add funds to your wallet to place your first order.", time: "Just now", unread: true },
  { id: 2, icon: Megaphone, title: "New Kenya-targeted services", body: "Instagram Followers and Website Traffic now have Kenya-targeted options.", time: "2 hours ago", unread: true },
  { id: 3, icon: Gift, title: "Refer & Earn is live", body: "Share your referral link and earn a commission on every deposit your friends make.", time: "Yesterday", unread: true },
  { id: 4, icon: ShieldCheck, title: "Secure your account", body: "Add a phone number to your profile so we can reach you about your orders.", time: "3 days ago", unread: false },
];

export default function NotificationsPage() {
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const unread = items.filter((i) => i.unread).length;
  const shown = tab === "all" ? items : items.filter((i) => i.unread);

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div className="flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          <button onClick={() => setTab("all")} className={`rounded-full px-6 py-2.5 text-lg font-bold ${tab === "all" ? "bg-[#4f46e5] text-white" : "text-slate-700"}`}>All</button>
          <button onClick={() => setTab("unread")} className={`rounded-full px-6 py-2.5 text-lg font-bold ${tab === "unread" ? "bg-[#4f46e5] text-white" : "text-slate-700"}`}>Unread ({unread})</button>
        </div>
        <button onClick={() => setItems(items.map((i) => ({ ...i, unread: false })))} className="flex items-center gap-2 text-base font-medium">
          <CheckCheck size={20} /> Mark all as read
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
        {shown.length === 0 && <p className="p-8 text-center text-slate-500">Nothing here.</p>}
        {shown.map(({ id, icon: Icon, title, body, time, unread }) => (
          <div key={id} className={`flex gap-4 border-b border-slate-200 p-5 last:border-0 ${unread ? "bg-[#f1f3ff]" : ""}`}>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#d9f2f1] text-[#0f5c5c]"><Icon size={24} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xl font-bold">
                {title} {unread && <span className="h-2.5 w-2.5 rounded-full bg-[#4f46e5]" />}
              </div>
              <p className="mt-1 text-lg text-slate-600">{body}</p>
              <p className="mt-2 text-base text-slate-400">{time}</p>
            </div>
            <button onClick={() => setItems(items.filter((i) => i.id !== id))} className="self-start text-slate-500"><Trash2 size={22} /></button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
