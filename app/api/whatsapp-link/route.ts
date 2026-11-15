import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function userFrom(req: Request) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!jwt) return null;
  const { data } = await admin.auth.getUser(jwt);
  return data?.user ?? null;
}

export async function GET(req: Request) {
  const user = await userFrom(req);
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  const { data } = await admin
    .from("whatsapp_links")
    .select("wa_number")
    .eq("user_id", user.id);
  return NextResponse.json({ linked: (data ?? []).length > 0 });
}

export async function POST(req: Request) {
  const user = await userFrom(req);
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  await admin.from("whatsapp_link_codes").delete().eq("user_id", user.id);

  const code = String(crypto.randomInt(100000, 1000000));
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await admin
    .from("whatsapp_link_codes")
    .insert({ code, user_id: user.id, expires_at: expires });
  if (error) {
    return NextResponse.json({ error: "Could not create a code. Try again." }, { status: 500 });
  }
  return NextResponse.json({ code });
}
