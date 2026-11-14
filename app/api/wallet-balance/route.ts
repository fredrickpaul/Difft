import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!jwt) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { data: auth } = await admin.auth.getUser(jwt);
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { data: w } = await admin
    .from("wallets")
    .select("balance")
    .eq("user_id", user.id)
    .eq("currency", "KES")
    .maybeSingle();

  return NextResponse.json({ balance: Number(w?.balance ?? 0) });
    }
