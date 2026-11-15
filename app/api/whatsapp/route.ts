import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SITE = "https://difft.vercel.app";

const MENU =
  "DIFFT Social Growth\n\nReply with a number:\n1 - Wallet balance\n2 - My orders\n3 - Place an order\n4 - Add funds\n5 - Support\n\nType menu any time.";

async function sendText(to: string, body: string) {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );
  if (!res.ok) {
    console.error("WhatsApp send failed", res.status, (await res.text()).slice(0, 300));
  }
}

async function reply(from: string, text: string): Promise<string> {
  const t = text.trim().toLowerCase();

  const m = t.match(/^link\s+(\d{6})$/);
  if (m) {
    const { data: row } = await admin
      .from("whatsapp_link_codes")
      .select("user_id, expires_at")
      .eq("code", m[1])
      .maybeSingle();
    if (!row || new Date(row.expires_at).getTime() < Date.now()) {
      return "That code is wrong or has expired. Get a new one in Profile, then Connect WhatsApp.";
    }
    await admin.from("whatsapp_links").upsert({ wa_number: from, user_id: row.user_id });
    await admin.from("whatsapp_link_codes").delete().eq("code", m[1]);
    return "Your WhatsApp is now linked to your DIFFT account.\n\n" + MENU;
  }

  if (["hi", "hello", "hey", "menu", "start"].includes(t)) return MENU;

  const { data: link } = await admin
    .from("whatsapp_links")
    .select("user_id")
    .eq("wa_number", from)
    .maybeSingle();
  if (!link) {
    return `I don't know this number yet.\n\nTo link it: log in at ${SITE}, open Profile, tap Connect WhatsApp, and send me the code.`;
  }

  if (t === "1" || t === "balance") {
    const { data: w } = await admin
      .from("wallets")
      .select("balance")
      .eq("user_id", link.user_id)
      .eq("currency", "KES")
      .maybeSingle();
    const bal = Number(w?.balance ?? 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `Your DIFFT wallet balance is KES ${bal}.`;
  }

  if (t === "2" || t === "orders" || t === "my orders") {
    const { data: orders } = await admin
      .from("orders")
      .select("id, quantity, charge, status, created_at")
      .eq("user_id", link.user_id)
      .order("created_at", { ascending: false })
      .limit(5);
    if (!orders || orders.length === 0) return "You have no orders yet.";
    const lines = orders.map(
      (o: any) =>
        `#${String(o.id).slice(0, 6)} | qty ${o.quantity} | KES ${Number(o.charge).toFixed(0)} | ${o.status}`
    );
    return `Your last orders:\n\n${lines.join("\n")}\n\nSee all of them at ${SITE}/orders`;
  }

  if (t === "3" || t === "new order" || t === "place order") {
    return `Placing orders in chat is coming soon. For now, order at ${SITE}/order`;
  }

  if (t === "4" || t === "add funds") {
    return `Adding funds in chat is coming soon. For now, top up with M-Pesa at ${SITE}/add-funds`;
  }

  if (t === "5" || t === "support") {
    return `For help, open ${SITE}/support`;
  }

  return "Sorry, I didn't get that. Reply menu to see what I can do.";
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (
    expected &&
    u.searchParams.get("hub.mode") === "subscribe" &&
    u.searchParams.get("hub.verify_token") === expected
  ) {
    return new Response(u.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const raw = await req.text();

  const sig = req.headers.get("x-hub-signature-256") ?? "";
  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", process.env.WHATSAPP_APP_SECRET!)
      .update(raw)
      .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return new Response("Bad signature", { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("ok");
  }

  const msgs = payload?.entry?.[0]?.changes?.[0]?.value?.messages ?? [];
  for (const m of msgs) {
    const from = String(m.from);
    try {
      const text = m.type === "text" ? String(m.text?.body ?? "") : "";
      await sendText(from, text ? await reply(from, text) : "Please send a text message. Reply menu to see what I can do.");
    } catch (e) {
      console.error("bot error", e);
    }
  }

  return new Response("ok");
}
