import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!jwt) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const { data: auth } = await admin.auth.getUser(jwt);
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const { data: orders } = await admin
    .from("orders")
    .select("id, service_id, link, quantity, charge, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const list = orders ?? [];
  const ids = Array.from(new Set(list.map((o) => o.service_id)));

  const svcRes = ids.length
    ? await admin.from("services").select("id, name, category_id").in("id", ids)
    : null;
  const { data: cats } = await admin.from("categories").select("id, name");

  const catName = new Map((cats ?? []).map((c) => [c.id, c.name]));
  const svcName = new Map(
    (svcRes?.data ?? []).map((s) => [
      s.id,
      `${catName.get(s.category_id) ?? ""} ${s.name}`.trim(),
    ])
  );

  return NextResponse.json({
    orders: list.map((o) => ({
      id: o.id,
      service: svcName.get(o.service_id) ?? "Service",
      link: o.link,
      quantity: o.quantity,
      charge: Number(o.charge),
      status: o.status,
      created_at: o.created_at,
    })),
  });
     }
