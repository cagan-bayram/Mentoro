export interface RateLimitRecord {
  count: number;
  timestamp: number;
}

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;

const buckets = new Map<string, RateLimitRecord>();

export function rateLimit(key: string, limit = MAX_REQUESTS, windowMs = WINDOW_MS): boolean {
  const now = Date.now();
  const record = buckets.get(key);
  if (record && now - record.timestamp < windowMs) {
    if (record.count >= limit) {
      return false;
    }
    record.count += 1;
    buckets.set(key, record);
    return true;
  }
  buckets.set(key, { count: 1, timestamp: now });
  return true;
}

export function resetRateLimit() {
  buckets.clear();
}
