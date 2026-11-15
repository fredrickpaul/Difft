"use client";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { getSupabase } from "@/lib/sb";

// The WhatsApp number of your bot, digits only with country code
// (for the Meta test number, copy it from API Setup)
const BOT_NUMBER = "15550000000";

export default function WhatsAppLink() {
  const [linked, setLinked] = useState(false);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  async function tok() {
    const { data } = await getSupabase().auth.getSession();
    return data?.session?.access_token ?? null;
  }

  useEffect(() => {
    (async () => {
      const t = await tok();
      if (!t) return;
      const res = await fetch("/api/whatsapp-link", { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) setLinked((await res.json()).linked);
    })();
  }, []);

  async function getCode() {
    setMsg("");
    const t = await tok();
    if (!t) return setMsg("Please log in first.");
    const res = await fetch("/api/whatsapp-link", {
      method: "POST",
      headers: { Authorization: `Bearer ${t}` },
    });
    const out = await res.json();
    if (!res.ok) return setMsg(out.error ?? "Could not get a code.");
    setCode(out.code);
  }

  return (
    <section className="mt-5 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-3xl font-extrabold">
        <MessageCircle size={28} className="text-[#16a34a]" /> WhatsApp
      </h2>
      <p className="mt-2 text-lg text-slate-600">
        {linked
          ? "A WhatsApp number is linked to your account. You can link another one below."
          : "Link your WhatsApp to check your balance and orders in chat."}
      </p>
      <button
        onClick={getCode}
        className="mt-4 rounded-full bg-[#16a34a] px-7 py-4 text-xl font-bold text-white shadow-lg"
      >
        {code ? "Get a new code" : "Connect WhatsApp"}
      </button>
      {code && (
        <div className="mt-4 rounded-3xl bg-[#e8ebff] p-5">
          <div className="text-base text-[#4f46e5]">Send this message to the Difft bot (valid 10 minutes)</div>
          <div className="mt-1 text-3xl font-extrabold tracking-wider text-[#3b35c9]">LINK {code}</div>
          <a
            href={`https://wa.me/${BOT_NUMBER}?text=${encodeURIComponent("LINK " + code)}`}
            className="mt-3 inline-block rounded-full bg-[#4f46e5] px-6 py-3 text-lg font-bold text-white"
          >
            Open WhatsApp
          </a>
        </div>
      )}
      {msg && <p className="mt-3 text-lg text-red-700">{msg}</p>}
    </section>
  );
}
