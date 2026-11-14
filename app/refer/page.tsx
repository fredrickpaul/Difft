"use client";
import { useState } from "react";
import { Gift, Link2, Copy, Users, Wallet, UserPlus, MessageCircle, Send, Twitter } from "lucide-react";
import AppShell from "@/components/appshell";

const CODE = "DIFFTECH";
const LINK = `https://difft.vercel.app/login?ref=${CODE}`;

export default function ReferPage() {
  const [copied, setCopied] = useState(false);
  const share = encodeURIComponent(`Grow your socials with DIFFT: ${LINK}`);

  const stat = (Icon: any, label: string, value: string) => (
    <div className="flex items-center gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d9f2f1] text-[#0f5c5c]"><Icon size={26} /></span>
      <div><div className="text-lg text-slate-500">{label}</div><div className="text-3xl font-extrabold">{value}</div></div>
    </div>
  );

  const step = (n: number, Icon: any, title: string, text: string) => (
    <div className="rounded-3xl bg-[#f5f6fb] p-5">
      <div className="flex items-center gap-3 font-bold text-[#4f46e5]">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4f46e5] text-white">{n}</span> Step {n}
      </div>
      <div className="mt-3 flex items-center gap-2 text-2xl font-bold"><Icon size={22} /> {title}</div>
      <p className="mt-1 text-lg text-slate-500">{text}</p>
    </div>
  );

  return (
    <AppShell>
      <h1 className="mb-5 text-4xl font-extrabold">Refer & Earn</h1>
      <section className="rounded-[32px] p-6 text-white shadow-xl" style={{ background: "linear-gradient(135deg,#3b35c9,#6057e8 55%,#8b5cdc)" }}>
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20"><Gift size={30} /></span>
        <h2 className="mt-5 text-4xl font-extrabold leading-tight">Share DIFFT, earn 5% on every deposit.</h2>
        <p className="mt-3 text-lg text-white/85">Invite friends with your link. When they top up, you earn a commission into your wallet.</p>
        <div className="mt-5 flex items-center gap-2 overflow-hidden rounded-full bg-white/20 px-4 py-2.5 text-base">
          <Link2 size={18} className="shrink-0" /> <span className="truncate">{LINK}</span>
        </div>
        <button
          onClick={() => { navigator.clipboard?.writeText(LINK); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#16a34a] py-4 text-xl font-bold"
        >
          <Copy size={22} /> {copied ? "Copied!" : "Copy link"}
        </button>
        <div className="mt-4 flex gap-3">
          <a href={`https://wa.me/?text=${share}`} className="flex h-14 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/10"><MessageCircle size={24} /></a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(LINK)}`} className="flex h-14 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/10"><Send size={24} /></a>
          <a href={`https://twitter.com/intent/tweet?text=${share}`} className="flex h-14 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/10"><Twitter size={24} /></a>
        </div>
      </section>

      <div className="mt-5 space-y-3">
        {stat(Link2, "Link visits", "0")}
        {stat(Users, "Sign-ups", "0")}
        {stat(Wallet, "Total earned", "KES 0")}
      </div>

      <section className="mt-5 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-3xl font-extrabold">How it works</h2>
        <div className="space-y-3">
          {step(1, Link2, "Share your link", "Send it to friends, clients or your audience.")}
          {step(2, UserPlus, "They join DIFFT", "Friends sign up through your link.")}
          {step(3, Wallet, "You earn", "Get a commission each time they add funds.")}
        </div>
        <p className="mt-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-lg">
          Referral tracking and payouts are not connected yet, so the numbers above stay at 0 for now.
        </p>
      </section>
    </AppShell>
  );
}
