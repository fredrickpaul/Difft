import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const maxDuration = 60;

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

const PLATFORMS: [string, RegExp][] = [
  ["Instagram", /instagram/i],
  ["TikTok", /tiktok|tik tok/i],
  ["Facebook", /facebook/i],
  ["YouTube", /youtube/i],
  ["Twitter", /twitter|tweet|\bx (followers|likes|views|retweets|comments)/i],
  ["Telegram", /telegram/i],
  ["Spotify", /spotify/i],
  ["LinkedIn", /linkedin/i],
  ["Website", /website|web traffic|seo/i],
];

function platformOf(text: string) {
  for (const [p, re] of PLATFORMS) if (re.test(text)) return p;
  return "Other";
}

export async function POST(req: Request) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const { markupPercent, usdToKes } = await req.json();
  const markup = Number(markupPercent);
  const rate = Number(usdToKes);
  if (!(markup >= 0 && markup <= 500) || !(rate > 0)) {
    return NextResponse.json({ error: "Check the markup and the rate." }, { status: 400 });
  }

  const apiUrl = process.env.PROVIDER_API_URL;
  const apiKey = process.env.PROVIDER_API_KEY;
  if (!apiUrl || !apiKey) {
    return NextResponse.json({ error: "Provider settings are missing in Vercel." }, { status: 500 });
  }

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ key: apiKey, action: "services" }),
    cache: "no-store",
  });

  let list: any = null;
  try {
    list = await res.json();
  } catch {
    list = null;
  }
  if (!Array.isArray(list)) {
    return NextResponse.json(
      {
        error: "The provider did not return a service list.",
        detail: list ? JSON.stringify(list).slice(0, 200) : "No readable reply.",
      },
      { status: 502 }
    );
  }

  const rows: {
    platform: string;
    ref: string;
    name: string;
    costUsd: number;
    min: number;
    max: number;
    refill: boolean;
  }[] = [];

  for (const s of list) {
    const category = String(s.category ?? "").trim();
    const name = String(s.name ?? "").trim();
    const costUsd = Number(s.rate);
    if (!s.service || !name || !(costUsd >= 0)) continue;

    let min = Number(s.min);
    let max = Number(s.max);
    if (!Number.isFinite(min) || min < 1) min = 10;
    if (!Number.isFinite(max) || max < min) max = Math.max(min, 100000);

    const fromCategory = platformOf(category);
    rows.push({
      platform: fromCategory !== "Other" ? fromCategory : platformOf(name),
      ref: String(s.service),
      name: category ? `${category} | ${name}` : name,
      costUsd,
      min: Math.min(min, 2000000000),
      max: Math.min(max, 2000000000),
      refill: s.refill === true || s.refill === 1 || s.refill === "1",
    });
  }

  const { data: cats } = await admin.from("categories").select("id, name");
  const catId = new Map((cats ?? []).map((c) => [c.name, c.id]));

  const missing = Array.from(new Set(rows.map((r) => r.platform))).filter(
    (p) => !catId.has(p)
  );
  if (missing.length) {
    const { data: created } = await admin
      .from("categories")
      .insert(missing.map((name) => ({ name })))
      .select("id, name");
    for (const c of created ?? []) catId.set(c.name, c.id);
  }

  const dbRows = rows.map((r) => ({
    category_id: catId.get(r.platform),
    name: r.name,
    price_per_1000: Math.max(
      0.01,
      Math.ceil(r.costUsd * rate * (1 + markup / 100) * 100) / 100
    ),
    cost_usd: r.costUsd,
    min_qty: r.min,
    max_qty: r.max,
    provider_service_ref: r.ref,
    refill_info: r.refill ? "Refill available" : null,
    enabled: true,
  }));

  for (let i = 0; i < dbRows.length; i += 500) {
    const { error } = await admin
      .from("services")
      .upsert(dbRows.slice(i, i + 500), { onConflict: "provider_service_ref" });
    if (error) {
      console.error("import failed", error);
      return NextResponse.json({ error: `Import stopped: ${error.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({
    imported: dbRows.length,
    skipped: list.length - dbRows.length,
  });
    }
