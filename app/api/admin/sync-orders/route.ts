import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { smmStatus } from "@/lib/smmafrica";

export const maxDuration = 60;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPEN = ["pending", "processing", "in_progress"];

const MAP: Record<string, string> = {
  queued: "pending",
  pending: "pending",
  processing: "processing",
  "in progress": "in_progress",
  completed: "completed",
  partial: "partial",
  canceled: "canceled",
  cancelled: "canceled",
  refunded: "canceled",
  fail: "failed",
  failed: "failed",
};

async function refund(userId: string, amount: number) {
  if (!(amount > 0)) return;
  for (let i = 0; i < 3; i++) {
    const { data: w } = await admin
      .from("wallets")
      .select("id, balance")
      .eq("user_id", userId)
      .eq("currency", "KES")
      .maybeSingle();
    if (!w) return;
    const newBal = Number(w.balance) + amount;
    const { data: upd } = await admin
      .from("wallets")
      .update({ balance: newBal })
      .eq("id", w.id)
      .eq("balance", w.balance)
      .select("id");
    if (upd && upd.length > 0) {
      await admin.from("wallet_transactions").insert({
        wallet_id: w.id,
        user_id: userId,
        type: "refund",
        amount,
        balance_after: newBal,
        currency: "KES",
      });
      return;
    }
  }
}

// Applies one status update. The .in("status", OPEN) guard means only the first
// update that moves an order out of an open status wins, so a refund is never paid twice.
async function applyStatus(
  o: any,
  rawStatus: unknown,
  startRaw: unknown,
  remainingRaw: unknown
) {
  const status = MAP[String(rawStatus ?? "").trim().toLowerCase()];
  if (!status) return { changed: 0, refunded: 0 };

  const startCount = parseInt(String(startRaw));
  const remaining = parseInt(String(remainingRaw));

  const { data: moved } = await admin
    .from("orders")
    .update({
      status,
      start_count: Number.isFinite(startCount) ? startCount : null,
      remaining: Number.isFinite(remaining) ? remaining : null,
    })
    .eq("id", o.id)
    .in("status", OPEN)
    .select("id");

  if (!moved || moved.length === 0) return { changed: 0, refunded: 0 };

  const changed = status !== o.status ? 1 : 0;
  let refunded = 0;

  if (status === "canceled" || status === "failed") {
    await refund(o.user_id, Number(o.charge));
    refunded = 1;
  } else if (status === "partial" && o.quantity > 0 && remaining > 0) {
    const back = (Number(o.charge) * Math.min(remaining, o.quantity)) / o.quantity;
    await refund(o.user_id, Math.round(back * 100) / 100);
    refunded = 1;
  }
  return { changed, refunded };
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.ADMIN_IMPORT_KEY || key !== process.env.ADMIN_IMPORT_KEY) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const { data: open } = await admin
    .from("orders")
    .select("id, user_id, quantity, charge, provider_order_id, status, provider")
    .in("status", OPEN)
    .not("provider_order_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(100);

  if (!open || open.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, changed: 0 });
  }

  const fkmOrders = (open as any[]).filter((o) => o.provider !== "smmafrica");
  const smmOrders = (open as any[]).filter((o) => o.provider === "smmafrica");

  let changed = 0;
  let refunded = 0;
  const problems: string[] = [];

  // ---------- FKM ----------
  if (fkmOrders.length > 0) {
    try {
      const res = await fetch(process.env.FKM_API_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          key: process.env.FKM_API_KEY!,
          action: "status",
          orders: fkmOrders.map((o) => o.provider_order_id).join(","),
        }),
        cache: "no-store",
      });
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        problems.push("FKM did not return JSON");
      }
      if (data) {
        for (const o of fkmOrders) {
          const s = data?.[String(o.provider_order_id)];
          if (!s || s.error) continue;
          const r = await applyStatus(o, s.status, s.start_count, s.remaining);
          changed += r.changed;
          refunded += r.refunded;
        }
      }
    } catch {
      problems.push("FKM request failed");
    }
  }

  // ---------- smm.africa ----------
  for (let i = 0; i < smmOrders.length; i += 20) {
    const chunk = smmOrders.slice(i, i + 20);
    try {
      const r = await smmStatus(chunk.map((o) => String(o.provider_order_id)));
      const items: any[] = r.data?.orders;
      if (!r.ok || !Array.isArray(items)) {
        problems.push("smm.africa status error");
        continue;
      }
      const byId = new Map<string, any>();
      for (const it of items) {
        if (it?.order !== undefined) byId.set(String(it.order), it);
        if (it?.order_reference) byId.set(String(it.order_reference), it);
      }
      for (const o of chunk) {
        const s = byId.get(String(o.provider_order_id));
        if (!s || s.error || (s.http_status && s.http_status !== 200)) continue;
        const res2 = await applyStatus(o, s.status, s.start_count, s.remains);
        changed += res2.changed;
        refunded += res2.refunded;
      }
    } catch {
      problems.push("smm.africa request failed");
    }
  }

  return NextResponse.json({
    ok: true,
    checked: open.length,
    changed,
    refunded,
    ...(problems.length ? { problems } : {}),
  });
      }
