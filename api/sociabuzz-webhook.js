import qs from "querystring";
import { addDonation } from "../lib/store-redis.js";

function toNumberIDR(x) {
  if (x == null) return 0;
  if (typeof x === "number") return x;
  const n = Number(String(x)
    .replace(/rp/gi, "")
    .replace(/[.,](?=\d{3}\b)/g, "")
    .replace(/[^\d.-]/g, "")
    .trim());
  return Number.isFinite(n) ? n : 0;
}
const first = (...a) => a.find(v => v === 0 || (v && String(v).trim() !== ""));

export default async function handler(req, res) {
  // GET ping agar mudah tes di browser (harus 200 kalau route ada)
  if (req.method === "GET") return res.status(200).json({ ok: true, ping: "webhook route exists" });

  if (req.method !== "POST") return res.status(405).json({ ok: false, msg: "Method Not Allowed" });

  const SOCIABUZZ_TOKEN = process.env.SOCIABUZZ_TOKEN;
  const tokenFromQuery  = req.query?.token;
  const tokenFromHeader = req.headers["x-sociabuzz-token"] || req.headers["x-webhook-token"] || req.headers["x-token"];

  let body = req.body;
  const ctype = (req.headers["content-type"] || "").toLowerCase();
  if (typeof body === "string") {
    if (ctype.includes("application/x-www-form-urlencoded")) body = qs.parse(body);
    else { try { body = JSON.parse(body); } catch {} }
  }
  const tokenFromBody = body?.token || body?.webhook_token || body?.secret;
  const anyToken = tokenFromQuery || tokenFromHeader || tokenFromBody;

  if (!SOCIABUZZ_TOKEN || anyToken !== SOCIABUZZ_TOKEN) {
    return res.status(401).json({ ok: false, msg: "Invalid token" });
  }

  const p = body || {};
  const donation = {
    id: String(first(p.id, p.transaction_id, p.reference, p.payment_reference, p.order_id, Date.now())),
    name: String(first(p.name, p.supporter_name, p.customer_name, p.buyer_name, p.username, "Someone")).slice(0, 60),
    amount: toNumberIDR(first(p.amount, p.total, p.price, p.nominal, p.amount_rp, p.total_rp, p.gross_amount)),
    message: String(first(p.message, p.note, p.comment, p.supporter_message, "")).slice(0, 200),
    ts: Date.now(),
  };

  await addDonation(donation);
  return res.json({ ok: true });
}

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };
