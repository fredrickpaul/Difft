import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  return NextResponse.json({ ok: true, orderId, charge: Number(order?.charge ?? 0) });
    }
