"use client";
import { useEffect, useState } from "react";
import { Camera, Save, KeyRound } from "lucide-react";
import AppShell from "@/components/appshell";
import { getSupabase } from "@/lib/sb";
import WhatsAppLink from "@/components/whatsapplink";
export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [since, setSince] = useState("—");
  const [cur, setCur] = useState<"USD" | "KES">("KES");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setEmail(u.email ?? "");
      setName((u.user_metadata?.full_name as string) ?? "");
      setPhone((u.user_metadata?.phone as string) ?? "");
      setSince(new Date(u.created_at).toLocaleDateString());
    });
  }, []);

  async function save() {
    const { error } = await getSupabase().auth.updateUser({ data: { full_name: name, phone } });
    setMsg(error ? error.message : "Details saved.");
  }
  async function changePw() {
    if (pw.length < 6) return setMsg("Password must be at least 6 characters.");
    if (pw !== pw2) return setMsg("Passwords do not match.");
    const { error } = await getSupabase().auth.updateUser({ password: pw });
    setMsg(error ? error.message : "Password updated.");
    if (!error) { setPw(""); setPw2(""); }
  }

  const input = "w-full rounded-full border border-slate-200 bg-white px-5 py-4 text-base outline-none focus:border-[#6057E8]";
  const label = "mb-2 mt-5 block text-lg font-medium";
  const initials = (name || email || "DU").slice(0, 2).toUpperCase();

  return (
    <AppShell>
      <h1 className="mb-5 text-4xl font-extrabold">Profile</h1>
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center rounded-[32px] text-4xl font-extrabold text-white" style={{ background: "linear-gradient(135deg,#4f46e5,#7c6cf2)" }}>{initials}</div>
            <span className="absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-[#0f5c5c] text-white"><Camera size={18} /></span>
          </div>
          <div className="mt-4 text-2xl font-extrabold">{name || "DIFFT User"}</div>
          <div className="text-lg text-slate-500">{email || "Not signed in"}</div>
        </div>
        <div className="mt-5 border-t border-slate-200 pt-5">
          <div className="flex items-center justify-between text-lg">
            <span className="text-slate-600">Display currency</span>
            <div className="flex rounded-full border border-slate-200 p-1">
              {(["USD", "KES"] as const).map((c) => (
                <button key={c} onClick={() => setCur(c)} className={`rounded-full px-4 py-1.5 font-bold ${cur === c ? "bg-[#4f46e5] text-white" : "text-slate-600"}`}>{c}</button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-lg"><span className="text-slate-600">Member since</span><span className="font-semibold">{since}</span></div>
        </div>
      </section>

      <section className="mt-5 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-extrabold">Personal details</h2>
        <label className={label}>Full name</label>
        <input className={input} placeholder="Jane Wanjiku" value={name} onChange={(e) => setName(e.target.value)} />
        <label className={label}>Email</label>
        <input className={`${input} bg-slate-50`} value={email} readOnly />
        <label className={label}>Phone number</label>
        <input className={input} placeholder="+254 7XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button onClick={save} className="mt-5 flex items-center gap-2 rounded-full px-8 py-4 text-xl font-bold text-white shadow-lg" style={{ background: "linear-gradient(90deg,#4f46e5,#7c6cf2)" }}>
          <Save size={22} /> Save changes
        </button>
      </section>

      <section className="mt-5 rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-extrabold">Password</h2>
        <label className={label}>New password</label>
        <input type="password" className={input} value={pw} onChange={(e) => setPw(e.target.value)} />
        <label className={label}>Confirm new password</label>
        <input type="password" className={input} value={pw2} onChange={(e) => setPw2(e.target.value)} />
        <button onClick={changePw} className="mt-5 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-8 py-4 text-xl font-semibold">
          <KeyRound size={22} /> Update password
        </button>
      </section>
      <WhatsAppLink />
      {msg && <p className="mt-4 text-lg">{msg}</p>}
    </AppShell>
  );
}
