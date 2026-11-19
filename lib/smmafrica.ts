const API = "https://smm.africa/api/v3";

async function call(body: Record<string, unknown>, timeoutMs = 60000) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SMMAFRICA_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export const smmBalance = () => call({ action: "balance" }, 20000);

export const smmServices = () => call({ action: "services" });

export const smmAdd = (p: {
  service: number | string;
  link: string;
  quantity: number;
  idempotencyKey: string;
  maxChargeUsd?: number;
}) =>
  call({
    action: "add",
    service: p.service,
    link: p.link,
    quantity: p.quantity,
    idempotency_key: p.idempotencyKey,
    ...(p.maxChargeUsd !== undefined ? { max_charge: p.maxChargeUsd } : {}),
  });

// up to 20 order IDs per call; each item in data.orders has its own http_status
export const smmStatus = (ids: string[]) =>
  call({ action: "status", orders: ids.slice(0, 20) }, 30000);
