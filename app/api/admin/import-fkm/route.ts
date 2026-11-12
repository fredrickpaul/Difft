import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export const maxDuration = 60;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.ADMIN_IMPORT_KEY || key !== process.env.ADMIN_IMPORT_KEY) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }

  const apiUrl = process.env.FKM_API_URL!;
  const apiKey = process.env.FKM_API_KEY!;

  let { data: prov } = await admin
    .from("providers")
    .select("id")
    .eq("api_url", apiUrl)
    .maybeSingle();
  if (!prov) {
    const { data: created, error } = await admin
      .from("providers")
      .insert({ name: "FKM Booste", api_url: apiUrl, enabled: true })
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

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ key: apiKey, action: "services" }),
    cache: "no-store",
  });
  const text = await res.text();
  let list: any;
  try {
    list = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "FKM did not return JSON", status: res.status, sample: text.slice(0, 200) },
      { status: 502 }
    );
  }
  if (!Array.isArray(list)) {
    return NextResponse.json({ error: "FKM error", detail: list }, { status: 502 });
  }

  const idByExt = new Map<string, string>();
  for (let from = 0; ; from += 1000) {
    const { data } = await admin
      .from("provider_services")
      .select("id, external_id")
      .eq("provider_id", providerId)
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    data.forEach((r: any) => idByExt.set(String(r.external_id), r.id));
    if (data.length < 1000) break;
  }

  const rows = list.map((s: any) => ({
    id: idByExt.get(String(s.service)) ?? randomUUID(),
    provider_id: providerId,
    external_id: String(s.service),
    name: String(s.name ?? "").slice(0, 300),
    rate_usd: Number(s.rate) || 0,
    min_qty: parseInt(s.min) || 0,
    max_qty: parseInt(s.max) || 0,
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
    new: rows.filter((r) => !idByExt.has(r.external_id)).length,
  });
                              }
