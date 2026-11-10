"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "../../lib/auth-client";

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setMsg(error.message);
      else router.push("/order");
    }
    setBusy(false);
  }

  const box =
    "w-full rounded-xl border border-gray-300 bg-white p-3 text-[#203C43]";

  return (
    <main className="mx-auto max-w-md space-y-4 bg-gray-50 p-4">
      <h1 className="text-2xl font-bold text-[#203C43]">
        {mode === "login" ? "Log in to Difft" : "Create your Difft account"}
      </h1>

      <input
        className={box}
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className={box}
        type="password"
        placeholder="Password (at least 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={submit}
        disabled={busy || !email || !password}
        className="w-full rounded-xl bg-[#6057E8] p-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
      </button>

      {msg && <p className="text-sm text-[#203C43]">{msg}</p>}

      <button
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="block w-full text-center text-[#6057E8]"
      >
        {mode === "login"
          ? "New here? Create an account"
          : "Already have an account? Log in"}
      </button>
    </main>
  );
      }
