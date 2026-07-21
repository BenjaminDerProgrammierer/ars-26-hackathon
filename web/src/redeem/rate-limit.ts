type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const windowMs = 60_000;
const requestsPerWindow = 10;
const maxTrackedClients = 10_000;
const clients = new Map<string, RateLimitEntry>();

function clientKey(request: Request): string {
  return request.headers.get("x-azure-clientip")?.trim() || "unknown";
}

function pruneExpired(now: number): void {
  for (const [key, entry] of clients) {
    if (entry.resetAt <= now) clients.delete(key);
  }
}

export function redeemRateLimit(request: Request): number | null {
  const now = Date.now();
  if (clients.size >= maxTrackedClients) pruneExpired(now);

  const key = clientKey(request);
  const current = clients.get(key);
  if (!current || current.resetAt <= now) {
    if (clients.size >= maxTrackedClients) return Math.ceil(windowMs / 1_000);
    clients.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= requestsPerWindow) {
    return Math.max(1, Math.ceil((current.resetAt - now) / 1_000));
  }
  current.count += 1;
  return null;
}
