import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { smmServices } from "@/lib/smmafrica";

export const maxDuration = 60;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const API_URL = "https://smm.africa/api/v3";

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.ADMIN_IMPORT_KEY || key !== process.env.ADMIN_IMPORT_KEY) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  let { data: prov } = await admin
    .from("providers")
    .select("id")
    .eq("api_url", API_URL)
    .maybeSingle();
  if (!prov) {
    const { data: created, error } = await admin
      .from("providers")
      .insert({ name: "SMM Africa", api_url: API_URL, enabled: true })
      .select("id")
      .single();
    if (error || !created) {
      return NextResponse.json(
        { error: "Could not create provider", detail: error?.message },
        { status: 500 }
      );
    }
    prov = created;
  }
  const providerId = prov.id;

  let r;
  try {
    r = await smmServices();
  } catch (e) {
    return NextResponse.json({ error: "smm.africa did not answer" }, { status: 502 });
  }
  if (!r.ok || !Array.isArray(r.data)) {
    return NextResponse.json(
      { error: "smm.africa error", status: r.status, detail: r.data },
      { status: 502 }
    );
  }

  // Only plain "link + quantity" services; other types need extra order fields.
  const list = (r.data as any[]).filter(
    (s) => String(s.type ?? "Default") === "Default"
  );

  const idByExt = new Map<string, string>();
  for (let from = 0; ; from += 1000) {
    const { data } = await admin
      .from("provider_services")
      .select("id, external_id")
      .eq("provider_id", providerId)
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    data.forEach((x: any) => idByExt.set(String(x.external_id), x.id));
    if (data.length < 1000) break;
  }

  const rows = list.map((s: any) => ({
    id: idByExt.get(String(s.service)) ?? randomUUID(),
    provider_id: providerId,
    provider: "smmafrica",
    external_id: String(s.service),
    name: String(s.name ?? "").slice(0, 300),
    category: String(s.category ?? "Other").slice(0, 200),
    rate_usd: Number(s.rate) || 0,
    min_qty: Math.min(parseInt(s.min) || 0, 2000000000),
    max_qty: Math.min(parseInt(s.max) || 0, 2000000000),
  }));

  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await admin
      .from("provider_services")
      .upsert(rows.slice(i, i + 500), { onConflict: "id" });
    if (error) {
      return NextResponse.json({ error: error.message, at: i }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    provider_id: providerId,
    imported: rows.length,
    skipped_other_types: (r.data as any[]).length - list.length,
    new: rows.filter((x) => !idByExt.has(x.external_id)).length,
  });
}
