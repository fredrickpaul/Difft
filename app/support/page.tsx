"use client";
import { useState } from "react";
import { MessageCircle, Mail, LifeBuoy, SendHorizontal, ChevronDown } from "lucide-react";
import AppShell from "@/components/appshell";

// Replace with your real WhatsApp number (country code, no + or spaces)
const WHATSAPP = "254725257952";

const faqs = [
  ["How long does an order take to start?", "Most orders start within minutes to a few hours. The delivery time is shown on each service."],
  ["What does refill mean?", "If the count drops within the refill period, we top it back up at no extra cost."],
  ["Do you need my password?", "Never. We only need the link to your profile or post."],
  ["Which payment methods are supported?", "M-Pesa. Top up your wallet from the Add Funds page."],
  ["Can I see prices in Kenyan Shillings?", "Yes. Prices on the order page are in KES, and you can switch the display currency in the menu."],
];

export default function SupportPage() {
  const [topic, setTopic] = useState("Order issue");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const wa = (text: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  const input = "w-full rounded-full border border-slate-200 bg-white px-5 py-4 text-base outline-none focus:border-[#6057E8]";

  const card = (Icon: any, title: string, sub: string, href: string) => (
    <a href={href} className="flex items-center gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d9f2f1] text-[#0f5c5c]"><Icon size={26} /></span>
      <div><div className="text-xl font-bold">{title}</div><div className="text-lg text-slate-500">{sub}</div></div>
    </a>
  );

  return (
    <AppShell>
      <h1 className="mb-5 text-4xl font-extrabold">Support</h1>
      <div className="space-y-3">
      {card(
  MessageCircle,
  "Live chat",
  "Chat with our team on WhatsApp",
  wa(
    "Hello DIFFT Support Team,\n\n" +
    "I would like assistance with my account. Here are my details:\n\n" +
    "Name: \n" +
    "Account email: \n" +
    "Order ID (if any): \n" +
    "Issue: \n\n" +
    "Please let me know how we can resolve this. Thank you."
  )
)}
        {card(Mail, "Email", "Replies within a day", "mailto:difftsupport@gmail.com")}
        {card(LifeBuoy, "Help centre", "Guides and answers", "#faq")}
      </div>

      <section className="mt-5 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-extrabold">Open a ticket</h2>
        <label className="mb-2 mt-5 block text-lg font-medium">Topic</label>
        <div className="relative">
          <select className={`${input} appearance-none`} value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option>Order issue</option><option>Payment or wallet</option><option>Account</option><option>Other</option>
          </select>
          <ChevronDown size={20} className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <label className="mb-2 mt-5 block text-lg font-medium">Order ID (optional)</label>
        <input className={input} placeholder="e.g. 102394" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
        <label className="mb-2 mt-5 block text-lg font-medium">Message</label>
        <textarea className="h-40 w-full rounded-3xl border border-slate-200 bg-white p-5 text-base outline-none focus:border-[#6057E8]" placeholder="Tell us what happened..." value={message} onChange={(e) => setMessage(e.target.value)} />
        <a
          href={wa(`Support ticket\nTopic: ${topic}\nOrder ID: ${orderId || "-"}\n${message}`)}
          className="mt-5 flex items-center justify-center gap-3 rounded-full py-4 text-xl font-bold text-white shadow-lg"
          style={{ background: "linear-gradient(90deg,#4f46e5,#7c6cf2)" }}
        >
          <SendHorizontal size={22} /> Send ticket
        </a>
      </section>

      <section id="faq" className="mt-5 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-3xl font-extrabold">Common questions</h2>
        {faqs.map(([q, a], i) => (
          <div key={q} className="border-b border-slate-200 last:border-0">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between py-5 text-left text-xl font-bold">
              {q} <ChevronDown size={22} className={open === i ? "rotate-180" : ""} />
            </button>
            {open === i && <p className="pb-5 text-lg text-slate-600">{a}</p>}
          </div>
        ))}
      </section>
    </AppShell>
  );
}
