import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("secret") !== process.env.MPESA_CALLBACK_SECRET) {
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const cb = body?.Body?.stkCallback;
  if (!cb) return NextResponse.json({ ResultCode: 0, ResultDesc: "Ignored" });

  const items: any[] = cb.CallbackMetadata?.Item ?? [];
  const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value ?? null;

  const { error } = await admin.rpc("complete_deposit", {
    p_checkout_id: cb.CheckoutRequestID,
    p_success: cb.ResultCode === 0,
    p_code: String(cb.ResultCode),
    p_desc: cb.ResultDesc,
    p_receipt: receipt,
    p_raw: body,
  });
  if (error) console.error("complete_deposit failed", error);

  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
