import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAdmin(email?: string | null) {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

async function fetchAll(table: string, cols: string, apply?: (q: any) => any) {
  const rows: any[] = [];
  for (let from = 0; from < 20000; from += 1000) {
    let q: any = admin.from(table).select(cols).range(from, from + 999);
    if (apply) q = apply(q);
    const { data, error } = await q;
    if (error) return null;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export async function GET(req: Request) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!jwt) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const { data: auth } = await admin.auth.getUser(jwt);
  if (!isAdmin(auth?.user?.email)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  // "today" in Kenya time (UTC+3)
  const OFFSET = 3 * 3600 * 1000;
  const k = new Date(Date.now() + OFFSET);
  const startToday = Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate()) - OFFSET;
  const start7 = startToday - 6 * 86400000;
  const dayAgo = Date.now() - 86400000;
  const t = (s: any) => new Date(s).getTime();

  // users
  let users: any[] | null = [];
  try {
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) { users = null; break; }
      users.push(...data.users);
      if (data.users.length < 1000) break;
    }
  } catch {
    users = null;
  }
  const usersStat = users && {
    total: users.length,
    today: users.filter((u) => t(u.created_at) >= startToday).length,
    week: users.filter((u) => t(u.created_at) >= start7).length,
  };

  // orders
  const orders = await fetchAll("orders", "status,charge,created_at");
  const OPEN = ["pending", "processing", "in_progress"];
  const NOSALE = ["failed", "canceled"];
  let ordersStat: any = null;
  if (orders) {
    const byStatus: Record<string, number> = {};
    let salesToday = 0, ordersToday = 0, stuck = 0;
    for (const o of orders) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
      if (t(o.created_at) >= startToday && !NOSALE.includes(o.status)) {
        salesToday += Number(o.charge || 0);
        ordersToday++;
      }
      if (OPEN.includes(o.status) && t(o.created_at) < dayAgo) stuck++;
    }
    ordersStat = { total: orders.length, byStatus, salesToday, ordersToday, stuck };
  }

  // deposits (money coming in)
  const deps = await fetchAll("deposits", "status,amount,created_at");
  let depositsStat: any = null;
  if (deps) {
    let today = 0, week = 0, all = 0;
    for (const d of deps) {
      if (d.status !== "success") continue;
      const a = Number(d.amount || 0);
      all += a;
      if (t(d.created_at) >= startToday) today += a;
      if (t(d.created_at) >= start7) week += a;
    }
    depositsStat = { today, week, all };
  }

  // wallet balances customers are holding
  const wallets = await fetchAll("wallets", "balance", (q) => q.eq("currency", "KES"));
  const walletsTotal = wallets ? wallets.reduce((s, w) => s + Number(w.balance || 0), 0) : null;

  // FKM balance
  let fkm: any = null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(process.env.FKM_API_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ key: process.env.FKM_API_KEY!, action: "balance" }),
      cache: "no-store",
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const j = JSON.parse(await res.text());
    if (j && j.balance !== undefined) {
      fkm = { balance: Number(j.balance), currency: j.currency ?? "USD" };
    }
  } catch {}

  return NextResponse.json({
    users: usersStat,
    orders: ordersStat,
    deposits: depositsStat,
    walletsTotal,
    fkm,
  });
    }
