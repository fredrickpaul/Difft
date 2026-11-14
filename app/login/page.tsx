"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, ArrowLeft } from "lucide-react";
import { getSupabase } from "@/lib/sb";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit() {
    setBusy(true);
    setMsg("");
    const supabase = getSupabase();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setMsg(error.message);
      else if (!data.session)
        setMsg("Check your email to confirm your account, then log in.");
      else router.push("/order");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else router.push("/order");
    }
    setBusy(false);
  }

  async function forgot() {
    if (!email) return setMsg("Enter your email first, then tap Forgot password.");
    const { error } = await getSupabase().auth.resetPasswordForEmail(email);
    setMsg(error ? error.message : "Password reset email sent. Check your inbox.");
  }

  const input =
    "w-full rounded-full border border-slate-200 bg-white px-5 py-4 text-lg text-slate-900 outline-none focus:border-[#6057E8]";

  return (
    <main
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "linear-gradient(160deg,#e4e5fb,#f5f6fb 45%,#d7ebe5)" }}
    >
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="flex h-[58px] w-[58px] items-center justify-center rounded-full text-2xl font-extrabold text-white"
              style={{ background: "linear-gradient(135deg,#4f46e5,#7c6cf2)" }}
            >
              D
            </div>
            <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#16a34a]" />
          </div>
          <div>
            <div className="text-3xl font-extrabold leading-none">DIFFT</div>
            <div className="mt-1.5 text-sm tracking-[0.25em] text-slate-500">SOCIAL GROWTH</div>
          </div>
        </div>

        <h1 className="mt-8 text-4xl font-extrabold tracking-tight">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-lg text-slate-500">
          {mode === "login"
            ? "Top up with M-Pesa and grow on DIFFT."
            : "Sign up to start growing your channels."}
        </p>

        <label className="mb-2 mt-7 block text-lg font-medium">Email</label>
        <input
          className={input}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="mb-2 mt-5 flex items-center justify-between">
          <label className="text-lg font-medium">Password</label>
          {mode === "login" && (
            <button onClick={forgot} className="text-base font-medium text-[#4f46e5]">
              Forgot password?
            </button>
          )}
        </div>
        <input
          className={input}
          type="password"
          placeholder={mode === "signup" ? "At least 6 characters" : ""}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={submit}
          disabled={busy || !email || !password}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-full py-4 text-xl font-bold text-white shadow-lg disabled:opacity-50"
          style={{ background: "linear-gradient(90deg,#4f46e5,#7c6cf2)" }}
        >
          {mode === "login" ? <LogIn size={22} /> : <UserPlus size={22} />}
          {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Sign up"}
        </button>

        {msg && <p className="mt-4 text-center text-base text-slate-700">{msg}</p>}

        <button
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(""); }}
          className="mt-6 block w-full text-center text-lg text-slate-600"
        >
          {mode === "login" ? "New to DIFFT? " : "Already have an account? "}
          <span className="font-semibold text-[#4f46e5]">
            {mode === "login" ? "Create an account" : "Sign in"}
          </span>
        </button>

        <Link href="/order" className="mt-5 flex items-center justify-center gap-2 text-lg font-medium text-[#4f46e5]">
          <ArrowLeft size={20} /> Back to dashboard
        </Link>
      </div>
    </main>
  );
}
