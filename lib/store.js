// NOTE: In-memory (reset saat redeploy/cold start). Produksi: pakai Upstash Redis.
let donations = []; // {id, name, amount, message, ts}

export function addDonation(d) {
  if (!donations.find(x => x.id === d.id)) {
    donations.push(d);
    if (donations.length > 500) donations = donations.slice(-200);
  }
}

export function getSince(ts = 0) {
  const items = donations.filter(d => d.ts > Number(ts || 0));
  return { items, latestTs: Date.now() };
}
