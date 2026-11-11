import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

const OPEN = ["pending", "processing", "in_progress"];

async function requireAdmin(req: Request) {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!jwt) return false;
  const { data } = await admin.auth.getUser(jwt);
  const email = data?.user?.email?.toLowerCase();
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return !!email && allowed.includes(email);
}

export async function GET(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const view = new URL(req.url).searchParams.get("view") ?? "open";
  let query = admin
    .from("orders")
    .select("id, user_id, service_id, link, quantity, charge, status, created_at")
    .limit(100);

  query =
    view === "done"
      ? query.not("status", "in", `(${OPEN.join(",")})`).order("created_at", { ascending: false })
      : query.in("status", OPEN).order("created_at", { ascending: true });

  const { data: orders } = await query;
  const list = orders ?? [];

  const serviceIds = Array.from(new Set(list.map((o) => o.service_id)));
  const userIds = Array.from(new Set(list.map((o) => o.user_id)));

  const svcRes = serviceIds.length
    ? await admin.from("services").select("id, name, category_id").in("id", serviceIds)
    : null;
  const { data: cats } = await admin.from("categories").select("id, name");

  const catName = new Map((cats ?? []).map((c) => [c.id, c.name]));
  const svcName = new Map(
    (svcRes?.data ?? []).map((s) => [
      s.id,
      `${catName.get(s.category_id) ?? ""} ${s.name}`.trim(),
    ])
  );

  const emails = new Map<string, string>();
  await Promise.all(
    userIds.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      emails.set(id, data?.user?.email ?? "unknown");
    })
  );

  return NextResponse.json({
    orders: list.map((o) => ({
      id: o.id,
      email: emails.get(o.user_id) ?? "unknown",
      service: svcName.get(o.service_id) ?? "Service",
      link: o.link,
      quantity: o.quantity,
      charge: Number(o.charge),
      status: o.status,
      created_at: o.created_at,
    })),
  });
}

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { orderId, action } = await req.json();
  if (!orderId || !action) {
    return NextResponse.json({ error: "Missing order or action" }, { status: 400 });
  }

  if (action === "cancel") {
    const { error } = await admin.rpc("cancel_order", { p_order: orderId });
    if (error) {
      return NextResponse.json(
        { error: error.code === "P0001" ? error.message : "Could not cancel the order." },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true });
  }

  const status =
    action === "processing" ? "processing" : action === "completed" ? "completed" : null;
  if (!status) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .in("status", OPEN)
    .select("id");

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: "Could not update the order." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
        }
