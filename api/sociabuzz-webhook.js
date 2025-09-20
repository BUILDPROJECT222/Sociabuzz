// api/sociabuzz-webhook.js
import { addDonation } from "../lib/store.js";
import qs from "querystring";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, msg: "Method Not Allowed" });

  // --- DEBUG LOG: matikan setelah fix ---
  console.log("HEADERS:", req.headers);
  console.log("RAW BODY TYPE:", typeof req.body, "VALUE:", req.body);

  // Handle kalau Sociabuzz kirim form-encoded
  let body = req.body;
  const ctype = (req.headers["content-type"] || "").toLowerCase();
  if (typeof body === "string") {
    // Vercel bisa memberi string mentah untuk form-encoded
    if (ctype.includes("application/x-www-form-urlencoded")) {
      body = qs.parse(body);
    } else {
      try { body = JSON.parse(body); } catch (e) {}
    }
  }

  const SOCIABUZZ_TOKEN = process.env.SOCIABUZZ_TOKEN;

  // Cari token di beberapa tempat umum
  const tokenCandidates = [
    req.headers["x-sociabuzz-token"],
    req.headers["x-webhook-token"],
    req.headers["x-token"],
    body?.token,
    body?.webhook_token,
    body?.secret,
    req.query?.token
  ].filter(Boolean);

  const valid = tokenCandidates.some(t => t === SOCIABUZZ_TOKEN);
  if (!SOCIABUZZ_TOKEN || !valid) {
    console.warn("Token mismatch. Candidates:", tokenCandidates);
    return res.status(401).json({ ok: false, msg: "Invalid token" });
  }

  const p = body || {};

  const donation = {
    id: String(p.id || p.transaction_id || p.reference || Date.now()),
    name: p.name || p.supporter_name || p.customer_name || "Someone",
    amount: Number(p.amount || p.total || p.price || 0),
    message: p.message || p.note || p.comment || "",
    ts: Date.now(),
  };

  addDonation(donation);
  return res.json({ ok: true });
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" }, // biarkan on; kita handle form-encoded manual jika perlu
  },
};
