import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const SET_KEY  = "sb:donations:set";
const LIST_KEY = "sb:donations:list";

export async function addDonation(d) {
  if (!d?.id) return;
  const added = await redis.sadd(SET_KEY, d.id);
  if (added === 1) {
    await redis.rpush(LIST_KEY, JSON.stringify(d));
    await redis.ltrim(LIST_KEY, -1000, -1); // keep last 1000
  }
}

export async function getSince(ts = 0) {
  const since = Number(ts || 0);
  const rows = await redis.lrange(LIST_KEY, 0, -1);
  const items = [];
  for (const s of rows) {
    try {
      const obj = JSON.parse(s);
      if (obj?.ts && obj.ts > since) items.push(obj);
    } catch {} // ignore bad rows
  }
  return { items, latestTs: Date.now() };
}
