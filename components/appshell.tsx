"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X, Wallet, Bell, LayoutGrid, ClipboardList,
  User, Gift, Headphones, LogIn, Plus,
} from "lucide-react";
import { getSupabase } from "@/lib/sb";

const nav = [
  { href: "/order", label: "New Order", icon: LayoutGrid },
  { href: "/add-funds", label: "Add Funds", icon: Wallet },
  { href: "/orders", label: "My Orders", icon: ClipboardList },
  { href: "/notifications", label: "Notifications", icon: Bell, badge: 3 },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/refer", label: "Refer & Earn", icon: Gift },
  { href: "/support", label: "Support", icon: Headphones },
];

function Logo({ size = 48 }: { size?: number }) {
  return (
    <div className="relative">
      <div
        className="flex items-center justify-center rounded-full font-extrabold text-white shadow-lg"
        style={{ width: size, height: size, background: "linear-gradient(135deg,#4f46e5,#7c6cf2)", fontSize: size * 0.42 }}
      >
        D
      </div>
      <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#16a34a]" />
    </div>
  );
}

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
  balance?: string;
}) {
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState<"USD" | "KES">("KES");
  const [bal, setBal] = useState<number | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const path = usePathname();

  useEffect(() => {
    (async () => {
      const { data } = await getSupabase().auth.getSession();
      const token = data?.session?.access_token;
      if (!token) return;
      setSignedIn(true);
      const res = await fetch("/api/wallet-balance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBal((await res.json()).balance);
    })();
  }, []);

  const balance =
    bal === null
      ? "KES --"
      : `KES ${bal.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  async function logout() {
    await getSupabase().auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[#f5f6fb]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-[#f8f9fc]/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-4">
          <button onClick={() => setOpen(true)} aria-label="Menu" className="text-[#0f5c5c]">
            <Menu size={26} />
          </button>
          <Link href="/order" className="flex items-center gap-3">
            <Logo />
            <span className="text-2xl font-extrabold tracking-tight text-[#0f172a]">DIFFT</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/add-funds" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-lg font-semibold shadow-sm">
            <Wallet size={20} className="text-[#0f5c5c]" /> {balance}
          </Link>
          <Link href="/notifications" className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
            <Bell size={20} className="text-[#0f5c5c]" />
            <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-[#4f46e5]" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-5">{children}</main>

      {open && <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[78%] max-w-sm flex-col overflow-y-auto bg-white p-5 transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Logo size={52} />
            <div>
              <div className="text-2xl font-extrabold leading-none">DIFFT</div>
              <div className="mt-1 text-xs tracking-[0.25em] text-slate-500">SOCIAL GROWTH</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="rounded-full border-2 border-[#7c6cf2] p-1 text-[#4f46e5]">
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 rounded-[28px] p-5 text-white shadow-xl" style={{ background: "linear-gradient(135deg,#3b35c9,#6d5be6 60%,#8b5cdc)" }}>
          <div className="text-sm font-medium tracking-wider text-white/80">WALLET BALANCE</div>
          <div className="mt-1 text-3xl font-extrabold">{balance}</div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex rounded-full bg-white/20 p-1">
              {(["USD", "KES"] as const).map((c) => (
                <button key={c} onClick={() => setCur(c)}
                  className={`rounded-full px-4 py-1.5 text-sm font-bold ${cur === c ? "bg-white text-[#3b35c9]" : "text-white/90"}`}>
                  {c}
                </button>
              ))}
            </div>
            <Link href="/add-funds" onClick={() => setOpen(false)} className="flex items-center gap-1 rounded-full bg-[#16a34a] px-4 py-2.5 text-sm font-bold shadow-lg">
              <Plus size={18} /> Add Funds
            </Link>
          </div>
        </div>

        <nav className="mt-5 flex flex-col gap-1.5">
          {nav.map(({ href, label, icon: Icon, badge }) => {
            const active = path === href;
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={`flex items-center gap-4 rounded-2xl px-3 py-3 text-lg ${active ? "bg-[#e8ebff] text-[#2f35b8]" : "text-slate-800"}`}>
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${active ? "bg-[#4f46e5] text-white" : "bg-[#d9f2f1] text-[#0f5c5c]"}`}>
                  <Icon size={22} />
                </span>
                <span className="flex-1 font-medium">{label}</span>
                {badge ? <span className="rounded-full bg-[#4f46e5] px-2.5 py-0.5 text-sm font-bold text-white">{badge}</span> : null}
              </Link>
            );
          })}
        </nav>

        {signedIn ? (
          <button onClick={logout} className="mt-auto flex items-center gap-4 px-3 pt-6 text-lg font-semibold text-[#4f46e5]">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4f46e5] text-white"><LogIn size={22} /></span>
            Logout
          </button>
        ) : (
          <Link href="/login" onClick={() => setOpen(false)} className="mt-auto flex items-center gap-4 px-3 pt-6 text-lg font-semibold text-[#4f46e5]">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4f46e5] text-white"><LogIn size={22} /></span>
            Sign in
          </Link>
        )}
      </aside>
    </div>
  );
}
