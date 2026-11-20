import { kvIncr } from "./kv";
import { UserFacingError } from "./http";

const PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN || 12);
const PER_DAY = Number(process.env.RATE_LIMIT_PER_DAY || 200);

/** Per-IP fixed-window limits that protect the shared free-tier quotas. */
export async function enforceRateLimit(ip: string) {
  const now = Date.now();
  const minuteWindow = Math.floor(now / 60_000);
  const dayWindow = new Date(now).toISOString().slice(0, 10);

  const [perMin, perDay] = await Promise.all([
    kvIncr(`rl:m:${ip}:${minuteWindow}`, 70),
    kvIncr(`rl:d:${ip}:${dayWindow}`, 90_000),
  ]);

  if (perMin > PER_MIN) {
    const retry = 60 - Math.floor((now % 60_000) / 1000);
    throw new UserFacingError(
      `You're sending messages too quickly. Try again in ${retry}s.`,
      429,
      "rate_limited_ip",
      retry,
    );
  }
  if (perDay > PER_DAY) {
    throw new UserFacingError(
      "Daily message limit reached for your network. It resets at 00:00 UTC.",
      429,
      "daily_limit_ip",
    );
  }
}
