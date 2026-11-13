import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAP: Record<string, string> = {
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

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.ADMIN_IMPORT_KEY || key !== process.env.ADMIN_IMPORT_KEY) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const { data: open } = await admin
    .from("orders")
    .select("id, user_id, quantity, charge, provider_order_id, status")
    .in("status", ["pending", "processing", "in_progress"])
    .not("provider_order_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(100);

  if (!open || open.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, changed: 0 });
  }

  const res = await fetch(process.env.FKM_API_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      key: process.env.FKM_API_KEY!,
      action: "status",
      orders: open.map((o: any) => o.provider_order_id).join(","),
    }),
    cache: "no-store",
  });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "FKM did not return JSON", sample: text.slice(0, 200) },
      { status: 502 }
    );
  }

  let changed = 0;
  let refunded = 0;

  for (const o of open as any[]) {
    const s = data?.[String(o.provider_order_id)];
    if (!s || s.error) continue;

    const status = MAP[String(s.status ?? "").trim().toLowerCase()];
    if (!status) continue;

    const startCount = parseInt(s.start_count);
    const remaining = parseInt(s.remaining);

    // Only the first update that moves the order out of an open status wins,
    // so a refund can never be paid twice.
    const { data: moved } = await admin
      .from("orders")
      .update({
        status,
        start_count: Number.isFinite(startCount) ? startCount : null,
        remaining: Number.isFinite(remaining) ? remaining : null,
      })
      .eq("id", o.id)
      .in("status", ["pending", "processing", "in_progress"])
      .select("id");

    if (!moved || moved.length === 0) continue;
    if (status !== o.status) changed++;

    if (status === "canceled" || status === "failed") {
      await refund(o.user_id, Number(o.charge));
      refunded++;
    } else if (status === "partial" && o.quantity > 0 && remaining > 0) {
      const back = (Number(o.charge) * Math.min(remaining, o.quantity)) / o.quantity;
      await refund(o.user_id, Math.round(back * 100) / 100);
      refunded++;
    }
  }

  return NextResponse.json({ ok: true, checked: open.length, changed, refunded });
    }
