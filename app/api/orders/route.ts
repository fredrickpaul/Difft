import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { smmAdd } from "@/lib/smmafrica";

export const maxDuration = 60;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function refund(userId: string, orderId: string, charge: number) {
  for (let i = 0; i < 3; i++) {
    const { data: w } = await admin
      .from("wallets")
      .select("id, balance")
      .eq("user_id", userId)
      .eq("currency", "KES")
      .maybeSingle();
    if (!w) break;

    const newBal = Number(w.balance) + charge;
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
        amount: charge,
        balance_after: newBal,
        currency: "KES",
      });
      break;
    }
  }
  await admin.from("orders").update({ status: "failed" }).eq("id", orderId);
}

async function sendToSmmAfrica(o: {
  userId: string;
  orderId: string;
  charge: number;
  externalId: string;
  link: string;
  qty: number;
}) {
  let last: { ok: boolean; status: number; data: any } | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      last = await smmAdd({
        service: o.externalId,
        link: o.link,
        quantity: o.qty,
        idempotencyKey: `difft-${o.orderId}`,
      });
    } catch (e) {
      console.error("smm.africa request problem", e);
      last = null;
      break; // unconfirmed: do not refund
    }
    if (last.ok || !last.data?.retryable) break;
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (last && last.ok && last.data?.order) {
    await admin
      .from("orders")
      .update({ provider_order_id: String(last.data.order), status: "processing" })
      .eq("id", o.orderId);
    return NextResponse.json({ ok: true, orderId: o.orderId, charge: o.charge });
  }

  // No answer, or the outcome is unconfirmed: the order may exist, so do not refund.
  if (!last || last.status === 409) {
    console.error("smm.africa unconfirmed", last?.data);
    return NextResponse.json({
      ok: true,
      orderId: o.orderId,
      charge: o.charge,
      note: "Order received and is being processed.",
    });
  }

  // Clearly refused: refund the customer.
  console.error("smm.africa rejected order", JSON.stringify(last.data).slice(0, 300));
  await refund(o.userId, String(o.orderId), o.charge);
  return NextResponse.json(
    { error: "This service is temporarily unavailable. You were not charged." },
    { status: 502 }
  );
}

export async function POST(req: Request) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!jwt) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const { data: auth } = await admin.auth.getUser(jwt);
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const { serviceId, link, quantity } = await req.json();
  const qty = Number(quantity);
  if (!serviceId || !String(link ?? "").trim() || !Number.isInteger(qty)) {
    return NextResponse.json({ error: "Missing service, link or quantity." }, { status: 400 });
  }

  // 1. Make sure the service is linked to a provider BEFORE charging anything.
  const { data: svc } = await admin
    .from("services")
    .select("id, provider_service_id")
    .eq("id", Number(serviceId))
    .maybeSingle();
  if (!svc || !svc.provider_service_id) {
    return NextResponse.json({ error: "This service is not available." }, { status: 400 });
  }

  const { data: ps } = await admin
    .from("provider_services")
    .select("external_id, provider")
    .eq("id", svc.provider_service_id)
    .maybeSingle();
  if (!ps?.external_id) {
    return NextResponse.json({ error: "This service is not available." }, { status: 400 });
  }
  const provider: string = ps.provider ?? "fkm";

  // 2. Charge the wallet and create the order.
  const { data: orderId, error } = await admin.rpc("place_order", {
    p_user: user.id,
    p_service: Number(serviceId),
    p_link: String(link).trim(),
    p_qty: qty,
  });

  if (error) {
    if (error.code === "P0001") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("place_order failed", error);
    return NextResponse.json({ error: "Could not place the order." }, { status: 500 });
  }

  const { data: order } = await admin
    .from("orders")
    .select("charge")
    .eq("id", orderId)
    .single();
  const charge = Number(order?.charge ?? 0);

  // Remember which provider got this order (used by the status sync).
  await admin.from("orders").update({ provider }).eq("id", orderId);

  // 3a. smm.africa
  if (provider === "smmafrica") {
    return sendToSmmAfrica({
      userId: user.id,
      orderId: String(orderId),
      charge,
      externalId: String(ps.external_id),
      link: String(link).trim(),
      qty,
    });
  }

  // 3b. FKM (unchanged)
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);

    const res = await fetch(process.env.FKM_API_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        key: process.env.FKM_API_KEY!,
        action: "add",
        service: String(ps.external_id),
        link: String(link).trim(),
        quantity: String(qty),
      }),
      cache: "no-store",
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    const text = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {}

    if (data && data.order) {
      await admin
        .from("orders")
        .update({ provider_order_id: String(data.order), status: "processing" })
        .eq("id", orderId);
      return NextResponse.json({ ok: true, orderId, charge });
    }

    console.error("FKM rejected order", text.slice(0, 300));
    await refund(user.id, String(orderId), charge);
    return NextResponse.json(
      { error: "This service is temporarily unavailable. You were not charged." },
      { status: 502 }
    );
  } catch (e) {
    console.error("FKM request problem", e);
    return NextResponse.json({
      ok: true,
      orderId,
      charge,
      note: "Order received and is being processed.",
    });
  }
      }
