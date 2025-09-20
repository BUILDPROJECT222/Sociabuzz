import { addDonation } from "../lib/store.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, msg: "Method Not Allowed" });

  const SOCIABUZZ_TOKEN = process.env.SOCIABUZZ_TOKEN;
  const tokenHeader = req.headers["x-sociabuzz-token"];
  const tokenBody = req.body?.token;

  // Verifikasi token (Sociabuzz akan kirim token yang kamu set di dashboard)
  if (!SOCIABUZZ_TOKEN || (tokenHeader !== SOCIABUZZ_TOKEN && tokenBody !== SOCIABUZZ_TOKEN)) {
    return res.status(401).json({ ok: false, msg: "Invalid token" });
  }

  const p = req.body || {};

  // Mapping field — sesuaikan setelah klik "Test Notification" di dashboard Sociabuzz:
  const donation = {
    id: String(p.id || p.transaction_id || p.reference || Date.now()),
    name: p.name || p.supporter_name || p.customer_name || "Someone",
    amount: Number(p.amount || p.total || p.price || 0),
    message: p.message || p.note || p.comment || "",
    ts: Date.now(),
  };

  addDonation(donation);

  // Sociabuzz minta HTTP Test Response -> balas OK
  return res.json({ ok: true });
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
  },
};
