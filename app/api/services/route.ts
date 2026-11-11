import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function GET() {
  const [{ data: svc }, { data: cats }] = await Promise.all([
    admin
      .from("services")
      .select("id, category_id, name, price_per_1000, min_qty, max_qty")
      .eq("enabled", true)
      .order("name")
      .limit(2000),
    admin.from("categories").select("id, name"),
  ]);

  const catName = new Map((cats ?? []).map((c) => [c.id, c.name]));
  const services = (svc ?? []).map((s) => ({
    id: s.id,
    platform: catName.get(s.category_id) ?? "Other",
    name: s.name,
    price_per_1000: Number(s.price_per_1000),
    min_qty: s.min_qty,
    max_qty: s.max_qty,
  }));

  return NextResponse.json({ services });
}
