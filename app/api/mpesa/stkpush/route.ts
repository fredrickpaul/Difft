import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE =
  process.env.MPESA_ENV === "live"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

async function getMpesaToken() {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");
  const res = await fetch(
    `${BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" }
  );
  const data = await res.json();
  return data.access_token as string;
}

export async function POST(req: Request) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!jwt) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data: auth } = await admin.auth.getUser(jwt);
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { phone, amount } = await req.json();

  let msisdn = String(phone).replace(/\D/g, "");
  if (msisdn.startsWith("0")) msisdn = "254" + msisdn.slice(1);
  if (!/^254[17]\d{8}$/.test(msisdn)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }
  const amt = Math.round(Number(amount));
  if (!amt || amt < 1) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const { data: dep, error: depErr } = await admin
    .from("deposits")
    .insert({
      user_id: user.id,
      method: "mpesa",
      currency: "KES",
      amount: amt,
      status: "pending",
      phone: msisdn,
    })
    .select("id")
    .single();
  if (depErr || !dep) {
    console.error(depErr);
    return NextResponse.json({ error: "Could not start deposit" }, { status: 500 });
  }

  const shortcode = process.env.MPESA_SHORTCODE!;
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const password = Buffer.from(
    `${shortcode}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString("base64");

  const token = await getMpesaToken();
  const res = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amt,
      PartyA: msisdn,
      PartyB: shortcode,
      PhoneNumber: msisdn,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: "Difft",
      TransactionDesc: "Wallet top up",
    }),
  });
  const data = await res.json();

  if (data.ResponseCode !== "0") {
    await admin
      .from("deposits")
      .update({ status: "failed", result_desc: data.errorMessage ?? data.ResponseDescription })
      .eq("id", dep.id);
    return NextResponse.json({ error: "M-Pesa request failed" }, { status: 502 });
  }

  await admin
    .from("deposits")
    .update({
      checkout_request_id: data.CheckoutRequestID,
      merchant_request_id: data.MerchantRequestID,
    })
    .eq("id", dep.id);

  return NextResponse.json({ ok: true, depositId: dep.id });
}
