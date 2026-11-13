import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

function detect(text: string): string | null {
  const t = text.toLowerCase();
  if (/instagram|\big\b|\binsta\b/.test(t)) return "instagram";
  if (/facebook|\bfb\b/.test(t)) return "facebook";
  if (/youtube|\byt\b/.test(t)) return "youtube";
  if (/twitter|tweet|\bx\b/.test(t)) return "twitter";
  if (/spotify/.test(t)) return "spotify";
  if (/tiktok|tik tok/.test(t)) return "tiktok";
  if (/linkedin/.test(t)) return "linkedin";
  if (/telegram/.test(t)) return "telegram";
  if (/website|traffic|visitors|seo\b|google/.test(t)) return "website";
  return null;
}

export async function GET() {
  const { data: cats } = await admin
    .from("categories")
    .select("id, name, platform");

  const catById = new Map((cats ?? []).map((c: any) => [c.id, c]));

  const all: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await admin
      .from("services")
      .select("id, category_id, name, price_per_1000, min_qty, max_qty")
      .eq("enabled", true)
      .order("id")
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
  }

  const services = all
    .filter(
      (s: any) =>
        !/^[-:~=\s]/.test(s.name) &&
        Number(s.price_per_1000) <= 100000 &&
        !(s.min_qty === 1 && s.max_qty === 1)
    )
    .map((s: any) => {
      const c: any = catById.get(s.category_id);
      const catName = c?.name ?? "Other";
      return {
        id: s.id,
        platform: detect(catName) ?? detect(s.name) ?? c?.platform ?? "other",
        category: catName,
        name: s.name,
        price_per_1000: Number(s.price_per_1000),
        min_qty: s.min_qty,
        max_qty: s.max_qty,
      };
    });

  return NextResponse.json({ services });
}
