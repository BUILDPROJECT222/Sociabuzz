import { addDonation } from "../lib/store.js";
import qs from "querystring";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, msg: "Method Not Allowed" });

  // (sementara) log dulu biar lihat payload asli
  console.log("HEADERS:", req.headers);

  // Ambil token dari QUERY (karena Sociabuzz tidak mengirim di header/body)
  const SOCIABUZZ_TOKEN = process.env.SOCIABUZZ_TOKEN;
  const tokenFromQuery = req.query?.token;

  if (!SOCIABUZZ_TOKEN || tokenFromQuery !== SOCIABUZZ_TOKEN) {
    console.warn("Token mismatch via query. Got:", tokenFromQuery);
    return res.status(401).json({ ok: false, msg: "Invalid token" });
    // NOTE: Jika kamu ingin mengizinkan tanpa token untuk sekali test,
    // sementara bisa return res.json({ ok: true }); (JANGAN untuk produksi).
  }

  // Parse body (JSON atau x-www-form-urlencoded)
  let body = req.body;
  const ctype = (req.headers["content-type"] || "").toLowerCase();
  if (typeof body === "string") {
    if (ctype.includes("application/x-www-form-urlencoded")) {
      body = qs.parse(body);
    } else {
      try { body = JSON.parse(body); } catch (e) {}
    }
  }

  const p = body || {};
  console.log("PAYLOAD:", p); // cek bentuk field aslinya dari Sociabuzz

  // Mapping sederhana — sesuaikan setelah lihat log PAYLOAD
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
  api: { bodyParser: { sizeLimit: "1mb" } },
};
