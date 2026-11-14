import crypto from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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

// Meta calls this once to verify the webhook
  console.log("WHATSAPP GET hit");
export async function GET(req: Request) {
  const u = new URL(req.url);
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!expected) {
    return new Response("Forbidden: WHATSAPP_VERIFY_TOKEN is not set on this deployment", { status: 403 });
  }
  if (
    u.searchParams.get("hub.mode") === "subscribe" &&
    u.searchParams.get("hub.verify_token") === expected
  ) {
    return new Response(u.searchParams.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden: token or mode does not match", { status: 403 });
}

// Meta sends every incoming message here
  console.log("WHATSAPP POST hit");
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
    const text = String(m.text?.body ?? "").trim().toLowerCase();

    if (["hi", "hello", "hey", "menu", "start"].includes(text)) {
      await sendText(
        from,
        "Welcome to DIFFT Social Growth 👋\n\nI'm the Difft bot. Soon you'll be able to:\n1. Check your wallet balance\n2. See your orders\n3. Place an order\n4. Add funds with M-Pesa\n5. Talk to support\n\nThese options are coming next."
      );
    } else {
      await sendText(from, "Thanks for your message. Reply *menu* to see what I can do.");
    }
  }

  return new Response("ok");
}
