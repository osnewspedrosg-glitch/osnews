import { createHash } from "node:crypto";

export function bucketId(secret) {
  return createHash("sha256").update(String(secret)).digest("hex");
}

export class RateLimiter {
  constructor({ rpm, rpd, now }) {
    this.rpm = rpm;
    this.rpd = rpd;
    this.now = now ?? (() => Date.now());
    this.buckets = new Map();
  }

  take(id) {
    const now = this.now();
    const bucket = this.buckets.get(id) ?? { minute: [], day: [] };
    const minuteAgo = now - 60_000;
    const dayAgo = now - 86_400_000;
    bucket.minute = bucket.minute.filter((stamp) => stamp > minuteAgo);
    bucket.day = bucket.day.filter((stamp) => stamp > dayAgo);
    if (bucket.minute.length >= this.rpm || bucket.day.length >= this.rpd) {
      this.buckets.set(id, bucket);
      return { ok: false, scope: bucket.minute.length >= this.rpm ? "minute" : "day" };
    }
    bucket.minute.push(now);
    bucket.day.push(now);
    this.buckets.set(id, bucket);
    return { ok: true };
  }
}
