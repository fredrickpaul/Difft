import { NextResponse } from "next/server";

const BASE =
  process.env.MPESA_ENV === "live"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

async function getToken() {
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

  const shortcode = process.env.MPESA_SHORTCODE!;
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const password = Buffer.from(
    `${shortcode}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString("base64");

  const token = await getToken();
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

  return NextResponse.json(await res.json());
}
