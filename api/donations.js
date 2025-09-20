import { getSince } from "../lib/store-redis.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, msg: "Method Not Allowed" });

  const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
  const auth = req.headers.authorization || "";
  if (!ROBLOX_API_KEY || auth !== `Bearer ${ROBLOX_API_KEY}`) {
    return res.status(401).json({ ok: false, msg: "Unauthorized" });
  }

  const since = req.query.since || "0";
  const out = getSince(Number(since));
  return res.json({ ok: true, items: out.items, latestTs: out.latestTs });
}
