import Link from "next/link";
import {
  Smartphone, Zap, ShieldCheck, LineChart, UserPlus, Wallet, ShoppingBag,
  ArrowRight, Instagram, Facebook, Youtube, Twitter, Linkedin, Send, Music, Music2,
} from "lucide-react";
import SwRegister from "@/components/swregister";

export const metadata = {
  title: "DIFFT | Social media growth services in Kenya, pay with M-Pesa",
  description:
    "DIFFT helps you grow your Instagram, TikTok, YouTube, Facebook and more from one dashboard. Pick a service, see the total, and pay with M-Pesa.",
  openGraph: {
    title: "DIFFT | Social Growth",
    description: "Grow every channel from one dashboard. Pay with M-Pesa.",
    type: "website",
  },
};

const platforms = [
  { n: "Instagram", Icon: Instagram, c: "#e1306c" },
  { n: "TikTok", Icon: Music2, c: "#111827" },
  { n: "YouTube", Icon: Youtube, c: "#e50914" },
  { n: "Facebook", Icon: Facebook, c: "#1d6fe0" },
  { n: "Twitter / X", Icon: Twitter, c: "#111111" },
  { n: "Spotify", Icon: Music, c: "#16a34a" },
  { n: "LinkedIn", Icon: Linkedin, c: "#0a66c2" },
  { n: "Telegram", Icon: Send, c: "#0ea5e9" },
];

const features = [
  { Icon: Smartphone, t: "Pay with M-Pesa", d: "Top up your wallet in seconds with an M-Pesa prompt on your phone." },
  { Icon: Zap, t: "Fast start", d: "Pick a service, see your total before you order, and track it live." },
  { Icon: ShieldCheck, t: "Refill options", d: "Many services come with refill, so your numbers stay up." },
  { Icon: LineChart, t: "One dashboard", d: "All your platforms and orders in one clean place." },
];

const steps = [
  { Icon: UserPlus, t: "Create an account", d: "Sign up with your email in a minute." },
  { Icon: Wallet, t: "Add funds", d: "Top up your wallet with M-Pesa." },
  { Icon: ShoppingBag, t: "Place an order", d: "Choose a platform and service, paste your link, and submit." },
];

const faqs = [
  ["How do I pay?", "You top up your DIFFT wallet with M-Pesa and spend from it on any service."],
  ["Do you need my password?", "Never. We only need the link to your profile or post."],
  ["What does refill mean?", "If the count drops within the refill period, it is topped up again at no extra cost."],
  ["How long does an order take to start?", "Most orders start within minutes to a few hours. The delivery time is shown on each service."],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f6fb] text-slate-900">
      <SwRegister />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-extrabold text-white"
            style={{ background: "linear-gradient(135deg,#4f46e5,#7c6cf2)" }}
          >
            D
          </span>
          <span className="text-2xl font-extrabold tracking-tight">DIFFT</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-full px-4 py-2 text-base font-semibold text-[#4f46e5]">
            Sign in
          </Link>
          <Link href="/order" className="rounded-full bg-[#4f46e5] px-5 py-2 text-base font-semibold text-white">
            Order now
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4">
        <div
          className="rounded-[32px] p-7 text-white shadow-xl md:p-12"
          style={{ background: "linear-gradient(135deg,#3b35c9,#6057e8 55%,#8b5cdc)" }}
        >
          <p className="inline-block rounded-full bg-white/20 px-4 py-2 text-base font-semibold">
            Social media growth for Kenya
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight md:text-6xl">
            Grow every channel from one dashboard.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">
            Choose a platform, pick a service, see your total before you order, and pay with M-Pesa.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/login" className="flex items-center gap-2 rounded-full bg-[#16a34a] px-7 py-4 text-lg font-bold">
              Create free account <ArrowRight size={20} />
            </Link>
            <Link href="/order" className="rounded-full bg-white/20 px-7 py-4 text-lg font-bold">
              See services
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-5xl px-4">
        <h2 className="text-3xl font-extrabold">Platforms we cover</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {platforms.map(({ n, Icon, c }) => (
            <div key={n} className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white p-3.5 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ background: c }}>
                <Icon size={24} />
              </span>
              <span className="text-lg font-bold">{n}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-5xl px-4">
        <h2 className="text-3xl font-extrabold">Why DIFFT</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {features.map(({ Icon, t, d }) => (
            <div key={t} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d9f2f1] text-[#0f5c5c]">
                <Icon size={24} />
              </span>
              <h3 className="mt-3 text-xl font-bold">{t}</h3>
              <p className="mt-1 text-base text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-5xl px-4">
        <h2 className="text-3xl font-extrabold">How it works</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {steps.map(({ Icon, t, d }, i) => (
            <div key={t} className="rounded-[28px] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 font-bold text-[#4f46e5]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4f46e5] text-white">{i + 1}</span>
                <Icon size={22} />
              </div>
              <h3 className="mt-3 text-xl font-bold">{t}</h3>
              <p className="mt-1 text-base text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-5xl px-4">
        <h2 className="text-3xl font-extrabold">Common questions</h2>
        <div className="mt-4 rounded-[28px] border border-slate-200 bg-white px-5 shadow-sm">
          {faqs.map(([q, a]) => (
            <details key={q} className="border-b border-slate-200 py-4 last:border-0">
              <summary className="cursor-pointer text-lg font-bold">{q}</summary>
              <p className="mt-2 text-base text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-5xl px-4">
        <div className="rounded-[32px] bg-[#e8ebff] p-7 text-center">
          <h2 className="text-3xl font-extrabold text-[#3b35c9]">Ready to grow?</h2>
          <p className="mt-2 text-lg text-slate-600">Create your account and place your first order today.</p>
          <Link href="/login" className="mt-5 inline-block rounded-full bg-[#4f46e5] px-8 py-4 text-lg font-bold text-white">
            Get started
          </Link>
        </div>
      </section>

      <footer className="mx-auto mt-10 max-w-5xl px-4 pb-10 text-center text-base text-slate-500">
        <div className="flex justify-center gap-6">
          <Link href="/order">Services</Link>
          <Link href="/support">Support</Link>
          <Link href="/login">Sign in</Link>
        </div>
        <p className="mt-3">© DIFFT Social Growth</p>
      </footer>
    </main>
  );
        }
