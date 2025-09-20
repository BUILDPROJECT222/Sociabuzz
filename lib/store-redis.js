// lib/store-redis.js
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Key set untuk dedup dan list utk urutan waktu
const SET_KEY = "sb:donations:set";    // set of donation ids
const LIST_KEY = "sb:donations:list";  // list of JSON strings (newest at the end)

export async function addDonation(d) {
  if (!d?.id) return;

  // Cek duplikat
  const added = await redis.sadd(SET_KEY, d.id);
  if (added === 1) {
    // push ke list; batasi panjang agar ringan
    await redis.rpush(LIST_KEY, JSON.stringify(d));
    // potong list jika kepanjangan (mis. simpan 1000 terakhir)
    await redis.ltrim(LIST_KEY, -1000, -1);
  }
}

export async function getSince(ts = 0) {
  ts = Number(ts || 0);
  // Ambil semua item (opsi lebih efisien: scan dari belakang dan berhenti jika ts <= since)
  const itemsRaw = await redis.lrange(LIST_KEY, 0, -1);
  const itemsParsed = [];
  for (const s of itemsRaw) {
    try {
      const obj = JSON.parse(s);
      if (obj?.ts && obj.ts > ts) itemsParsed.push(obj);
    } catch {}
  }
  return { items: itemsParsed, latestTs: Date.now() };
}
