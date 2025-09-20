import { getSince } from "../lib/store-redis.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, msg: "Method Not Allowed" });

  const ROBLOX_API_KEY = process.env.ROBLOX_API_KEY;
  if (!ROBLOX_API_KEY || req.headers.authorization !== `Bearer ${ROBLOX_API_KEY}`) {
    return res.status(401).json({ ok: false, msg: "Unauthorized" });
  }

  const since = Number(req.query.since || 0);
  const out = await getSince(since);
  return res.json({ ok: true, items: out.items, latestTs: out.latestTs });
}
